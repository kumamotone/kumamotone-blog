'use client'

import { createPost, deleteDraft, getDraft, saveDraft, updatePost } from '@/lib/posts'
import { uploadImage } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Node, mergeAttributes } from '@tiptap/core'
import CodeBlock from '@tiptap/extension-code-block'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useState } from 'react'

const CustomLink = Link.extend({
  inclusive: false,
  parseHTML() {
    return [
      {
        tag: 'a[href]:not([href *= "javascript:" i])',
      },
    ]
  },
  renderHTML({ HTMLAttributes }) {
    return ['a', HTMLAttributes, 0]
  },
});

const CustomCodeBlock = CodeBlock.extend({
  addKeyboardShortcuts() {
    return {
      'Mod-`': () => this.editor.commands.toggleCodeBlock(),
    }
  },
});

const Hashtag = Node.create({
  name: 'hashtag',
  group: 'inline',
  inline: true,
  selectable: false,
  atom: true,

  addAttributes() {
    return {
      hashtag: {
        default: null,
        parseHTML: element => element.getAttribute('data-hashtag'),
        renderHTML: attributes => {
          return {
            'data-hashtag': attributes.hashtag,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-hashtag]',
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { class: 'hashtag' }), `#${node.attrs.hashtag}`]
  },

  renderText({ node }) {
    return `#${node.attrs.hashtag}`
  },
});

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML: attributes => {
          if (!attributes.width) {
            return {}
          }
          return {
            width: attributes.width,
            style: `width: ${attributes.width}px`,
          }
        },
      },
    }
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const container = document.createElement('div')
      container.classList.add('image-resizer')

      const img = document.createElement('img')
      img.src = node.attrs.src
      img.alt = node.attrs.alt
      img.width = node.attrs.width || 'auto'

      container.append(img)

      const handle = document.createElement('div')
      handle.classList.add('resize-handle')
      container.append(handle)

      let startX: number
      let startWidth: number

      const onMouseDown = (e: MouseEvent) => {
        e.preventDefault()
        startX = e.pageX
        startWidth = img.width
        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
      }

      const onMouseMove = (e: MouseEvent) => {
        const diff = e.pageX - startX
        img.width = startWidth + diff
      }

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
        if (typeof getPos === 'function') {
          editor.view.dispatch(editor.view.state.tr.setNodeMarkup(getPos(), undefined, {
            ...node.attrs,
            width: img.width,
          }))
        }
      }

      handle.addEventListener('mousedown', onMouseDown)

      return {
        dom: container,
        destroy: () => {
          handle.removeEventListener('mousedown', onMouseDown)
        },
      }
    }
  },
});

interface PostEditorProps {
  initialTitle?: string;
  initialContent?: string;
  postId?: number;
  user: User | null;
}

export default function PostEditor({ initialTitle = '', initialContent = '', postId, user }: PostEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CustomLink,
      CustomCodeBlock,
      Hashtag,
      ResizableImage.configure({
        inline: true,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: 'ここに記事を書いてください...',
      }),
    ],
    content: initialContent || '', // 初期コンテンツが空の場合は空文字列を設定
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          const fileType = file.type;
          if (fileType.startsWith('image/')) {
            event.preventDefault();
            handleImageUpload(file, view, event);
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event, slice) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (const item of items) {
            if (item.type.startsWith('image/')) {
              event.preventDefault();
              const file = item.getAsFile();
              if (file) {
                handleImageUpload(file, view);
                return true;
              }
            }
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      // ここでリアルタイムプレビューの更新や自動保存の処理を行うことができます
    },
  });

  useEffect(() => {
    async function loadDraft() {
      if (user && !postId) {
        const drafts = await getDraft(user.id);
        if (drafts.length > 0) {
          const latestDraft = drafts[0]; // 最新のドラフトを使用
          setTitle(latestDraft.title);
          editor?.commands.setContent(latestDraft.content);
        }
      }
    }
    loadDraft();
  }, [user, postId, editor]);

  const handleSaveDraft = async () => {
    if (user && editor) {
      try {
        await saveDraft({
          user_id: user.id,
          title: title, // titleステートを使用
          content: editor.getHTML(),
          created_at: new Date().toISOString(), // created_atフィールドを追加
        });
        // ドラフト保存後のフィードバックを追加（オプション）
        alert('ドラフトが保存されました。');
      } catch (error) {
        console.error('Error saving draft:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user && editor) {
      try {
        setIsSaving(true);
        const newPost = await createPost({
          title: title,
          content: editor.getHTML(),
        });
        if (newPost) {
          await deleteDraft(user.id);
          router.push('/'); // ホームページにリダイレクト
        }
      } catch (error) {
        console.error('Error creating post:', error);
        setError('投稿の作成中にエラーが発生しました。');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleImageUpload = async (file: File, view?: any, event?: DragEvent) => {
    const imageUrl = await uploadImage(file);
    if (imageUrl && editor) {
      if (view && event) {
        const { state: { tr }, dispatch } = view;
        const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
        if (coordinates) {
          const node = editor.schema.nodes.image.create({ src: imageUrl, alt: file.name });
          dispatch(tr.insert(coordinates.pos, node));
        }
      } else {
        editor.chain().focus().setImage({ src: imageUrl, alt: file.name }).run();
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">{postId ? '記事編集' : '新しい記事を作成'}</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block mb-2">タイトル</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
        <div>
          <label htmlFor="content" className="block mb-2">内容</label>
          <div className="border border-gray-300 rounded p-2 min-h-[300px]">
            <EditorContent editor={editor} />
          </div>
        </div>
        <div className="flex justify-between">
          {!postId && (
            <button
              type="button"
              onClick={handleSaveDraft}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              disabled={isSaving}
            >
              {isSaving ? '保存中...' : '下書き保存'}
            </button>
          )}
          <button 
            type="submit" 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            disabled={isSaving}
          >
            {isSaving ? '投稿中...' : (postId ? '更新する' : '投稿する')}
          </button>
        </div>
      </form>
      <style jsx global>{`
        .image-resizer {
          display: inline-block;
          position: relative;
        }
        .resize-handle {
          position: absolute;
          right: -6px;
          bottom: -6px;
          width: 12px;
          height: 12px;
          background-color: #1a202c;
          border: 2px solid white;
          border-radius: 50%;
          cursor: se-resize;
        }
      `}</style>
    </div>
  );
}
