'use client'

import { createPost, deleteDraft, getDraft, saveDraft } from '@/lib/posts'
import { uploadImage } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Node, mergeAttributes } from '@tiptap/core'
import CodeBlock from '@tiptap/extension-code-block'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import debounce from 'lodash/debounce'
import NextLink from 'next/link'
import { useRouter } from 'next/navigation'
import { EditorView } from 'prosemirror-view'
import React, { useEffect, useState } from 'react'

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
  onSubmit?: (title: string, content: string) => Promise<void>;
}

export default function PostEditor({ initialTitle = '', initialContent = '', postId, user, onSubmit }: PostEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [draftContent, setDraftContent] = useState<{ title: string, content: string } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const router = useRouter();

  // debounceされた自動保存関数
  const debouncedSaveDraft = debounce(async (title: string, content: string) => {
    if (user && !postId) {
      try {
        await saveDraft({
          user_id: user.id,
          title: title,
          content: content,
          created_at: new Date().toISOString(),
        });
        setLastSavedAt(new Date());
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Error auto-saving draft:', error);
        // ここでユーザーに通知するか、エラー状態を設定することができます
        // 例: setError('ドラフトの自動保存に失敗しました。');
      }
    }
  }, 2000);

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
    content: content,
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
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
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
      const newContent = editor.getHTML();
      setContent(newContent);
      setHasUnsavedChanges(true);
      debouncedSaveDraft(title, newContent);
    },
    immediatelyRender: false, // この行を追加
  });

  useEffect(() => {
    async function loadDraft() {
      if (user && !postId) {
        try {
          const drafts = await getDraft(user.id);
          if (drafts.length > 0) {
            const latestDraft = drafts[0];
            setDraftContent({ title: latestDraft.title, content: latestDraft.content });
            setShowDraftDialog(true);
          }
        } catch (error) {
          console.error('Error loading draft:', error);
        }
      }
    }
    loadDraft();
  }, [user, postId]);

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '変更が保存されていません。このページを離れてもよろしいですか？';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const handleRestoreDraft = () => {
    if (draftContent) {
      setTitle(draftContent.title);
      setContent(draftContent.content);
      if (editor) {
        editor.commands.setContent(draftContent.content);
      }
    }
    setShowDraftDialog(false);
  };

  const handleDiscardDraft = () => {
    setShowDraftDialog(false);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleSaveDraft = async () => {
    if (user && editor) {
      try {
        await saveDraft({
          user_id: user.id,
          title: title,
          content: editor.getHTML(),
          created_at: new Date().toISOString(),
        });
        setLastSavedAt(new Date());
        setHasUnsavedChanges(false);
        alert('ドラフトが保存されました。');
      } catch (error) {
        console.error('Error saving draft:', error);
        alert('ドラフトの保存中にエラーが発生しました。');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user && editor) {
      try {
        setIsSaving(true);
        if (onSubmit) {
          await onSubmit(title, editor.getHTML());
        } else {
          const newPost = await createPost({
            title: title,
            content: editor.getHTML(),
          });
          if (newPost) {
            await deleteDraft(user.id);
            setHasUnsavedChanges(false);
            router.push('/');
          }
        }
      } catch (error) {
        console.error('Error creating/updating post:', error);
        setError('投稿の作成/更新中にエラーが発生しました。');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleImageUpload = async (file: File, view: EditorView, event?: DragEvent) => {
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
      {showDraftDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">保存されたドラフトがあります</h2>
            <p className="mb-4">保存されたドラフトを復元しますか？</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleDiscardDraft}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                破棄する
              </button>
              <button
                onClick={handleRestoreDraft}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                復元する
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{postId ? '記事編集' : '新しい記事を作成'}</h1>
        {postId && (
          <NextLink href="/blog/new" className="text-blue-500 hover:underline">
            新しい記事を書く
          </NextLink>
        )}
      </div>
      
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block mb-2">タイトル</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={handleTitleChange}
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
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center space-x-4">
            {lastSavedAt && (
              <p className="text-sm text-gray-500">
                自動保存: {lastSavedAt.toLocaleString()}
              </p>
            )}
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
          </div>
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