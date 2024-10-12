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
import React, { useCallback, useEffect, useState } from 'react'
import { FiEdit, FiHelpCircle, FiList, FiSave, FiSend } from 'react-icons/fi'

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
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const router = useRouter();

  // debounceされた自動保存関数を更新
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
        console.error('ドラフトの自動保存中にエラーが発生しました:', error);
      }
    }
  }, 100);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CustomLink,
      CustomCodeBlock,
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
      // 文字数の更新をトリガー
      getWordCount();
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
            setTitle(latestDraft.title);
            setContent(latestDraft.content);
            if (editor) {
              editor.commands.setContent(latestDraft.content);
            }
          }
        } catch (error) {
          console.error('ドラフトの読み込み中にエラーが発生しました:', error);
        }
      }
    }
    loadDraft();
  }, [user, postId, editor]);

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

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (hasUnsavedChanges) {
        const confirmMessage = '変更が保存されていません。このページを離れてもよろしいですか？';
        if (window.confirm(confirmMessage)) {
          return;
        } else {
          event.preventDefault();
          window.history.pushState(null, '', window.location.href);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges]);

  // タイトル変更ハンドラを更新
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setHasUnsavedChanges(true);
    debouncedSaveDraft(newTitle, content);
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
            await deleteDraft(user.id); // 下書きを削除
            setHasUnsavedChanges(false);
            localStorage.removeItem('draftTitle'); // ローカルストレージから下書きタイトルを削除
            localStorage.removeItem('draftContent'); // ローカルストレージから下書き内容を削除
            router.push('/');
          }
        }
      } catch (error) {
        console.error('投稿の作成/更新中にエラーが発生しました:', error);
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

  const getWordCount = useCallback(() => {
    if (editor) {
      const text = editor.state.doc.textContent
      return text.length
    }
    return 0
  }, [editor])

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <FiEdit className="mr-2" />
          {postId ? '記事編集' : '新しい記事を作成'}
        </h1>
        {postId && (
          <NextLink href="/blog/new" className="text-blue-500 hover:underline flex items-center">
            <FiEdit className="mr-2" />
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
            <EditorContent 
              editor={editor} 
              className="prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h4:text-base prose-h5:text-sm prose-h6:text-xs prose-code:bg-gray-100 prose-code:text-red-500 prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded"
            />
          </div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center space-x-2">
            {!postId && (
              <>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 flex items-center"
                  disabled={isSaving}
                >
                  <FiSave className="mr-2" />
                  {isSaving ? '保存中...' : '下書き保存'}
                </button>
                <NextLink 
                  href="/drafts" 
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 flex items-center"
                >
                  <FiList className="mr-2" />
                  下書き一覧
                </NextLink>
              </>
            )}
            {lastSavedAt && (
              <p className="text-sm text-gray-500 ml-4 flex items-center">
                <FiSave className="mr-2" />
                自動保存: {lastSavedAt.toLocaleString()}
              </p>
            )}
          </div>
          <button 
            type="submit" 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center"
            disabled={isSaving}
          >
            <FiSend className="mr-2" />
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
        .ProseMirror pre {
          background-color: #1a202c;
          color: #e2e8f0;
          padding: 1rem;
          border-radius: 0.375rem;
        }
        .ProseMirror pre code {
          color: inherit;
          padding: 0;
          background: none;
          font-size: 0.875em;
        }
        .ProseMirror p code {
          background-color: #f1f5f9;
          color: #ef4444;
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          font-size: 0.875em;
        }
      `}</style>
      <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-1 rounded-full shadow-lg">
        {getWordCount()} 文字
      </div>
      <div className="fixed bottom-4 left-4">
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors duration-200"
        >
          <FiHelpCircle size={24} />
        </button>
        {showHelp && (
          <div className="absolute bottom-12 left-0 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-64">
            <h3 className="font-bold mb-2">エディタの機能一覧</h3>
            <ul className="text-sm">
              <li>• # で見出し (H1〜H6)</li>
              <li>• --- で水平線</li>
              <li>• {'>'}で引用</li>
              <li>• * または - でリスト</li>
              <li>• 1. で番号付きリスト</li>
              <li>• `コード` でインラインコード</li>
              <li>• ```言語名 でコードブロック</li>
              <li>• [リンク](URL) でリンク</li>
              <li>• ![代替テキスト](画像URL) で画像</li>
              <li>• **太字** または __太字__</li>
              <li>• *斜体* または _斜体_</li>
              <li>• ~~打ち消し線~~</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}