'use client'

import { createPost, deleteDraft, deletePost, getDraft, saveDraft } from '@/lib/posts'
import { uploadImage } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { NodeViewProps } from '@tiptap/core'
import CodeBlock from '@tiptap/extension-code-block'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, NodeViewContent, NodeViewWrapper, ReactNodeViewRenderer, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import debounce from 'lodash/debounce'
import NextLink from 'next/link'
import { useRouter } from 'next/navigation'
import { EditorView } from 'prosemirror-view'
import React, { useCallback, useEffect, useState } from 'react'
import { FiAlertTriangle, FiArrowLeft, FiEdit, FiHelpCircle, FiList, FiSave, FiSend, FiTrash2 } from 'react-icons/fi'
import { toast } from 'react-toastify'

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

const CustomCodeBlockComponent = ({ node, updateAttributes }: NodeViewProps) => {
  return (
    <NodeViewWrapper className="code-block">
      <select
        contentEditable={false}
        defaultValue={node.attrs.language || 'text'}
        onChange={event => updateAttributes({ language: event.target.value })}
        className="language-select"
      >
        <option value="text">プレーンテキスト</option>
        <option value="javascript">JavaScript</option>
        <option value="typescript">TypeScript</option>
        <option value="html">HTML</option>
        <option value="css">CSS</option>
        <option value="python">Python</option>
        <option value="ruby">Ruby</option>
        <option value="go">Go</option>
        <option value="rust">Rust</option>
        <option value="java">Java</option>
        <option value="c">C</option>
        <option value="cpp">C++</option>
        <option value="csharp">C#</option>
        <option value="php">PHP</option>
        <option value="swift">Swift</option>
        <option value="kotlin">Kotlin</option>
        <option value="sql">SQL</option>
        <option value="shell">Shell</option>
        <option value="markdown">Markdown</option>
        <option value="json">JSON</option>
        <option value="yaml">YAML</option>
      </select>
      <pre>
        <NodeViewContent as="code" />
      </pre>
    </NodeViewWrapper>
  )
}

const CustomCodeBlock = CodeBlock.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CustomCodeBlockComponent)
  },
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
        default: 600, // デフォルトの幅を600pxに設定
        renderHTML: attributes => {
          if (!attributes.width) {
            return {};
          }
          return {
            width: attributes.width,
            style: `width: ${attributes.width}px; max-width: 100%;`, // max-widthを追加
          };
        },
      },
    };
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const container = document.createElement('div');
      container.classList.add('image-resizer');

      const img = document.createElement('img');
      img.src = node.attrs.src;
      img.alt = node.attrs.alt;
      img.width = node.attrs.width || 600; // デフォルトの幅を600pxに設定
      img.style.maxWidth = '100%'; // max-widthを100%に設定

      container.append(img);

      const handle = document.createElement('div');
      handle.classList.add('resize-handle');
      container.append(handle);

      let startX: number;
      let startWidth: number;

      const onMouseDown = (e: MouseEvent) => {
        e.preventDefault();
        startX = e.pageX;
        startWidth = img.width;
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      };

      const onMouseMove = (e: MouseEvent) => {
        const diff = e.pageX - startX;
        img.width = Math.max(200, Math.min(startWidth + diff, 800)); // 最小幅200px、最大幅800pxに制限
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        if (typeof getPos === 'function') {
          editor.view.dispatch(editor.view.state.tr.setNodeMarkup(getPos(), undefined, {
            ...node.attrs,
            width: img.width,
          }));
        }
      };

      handle.addEventListener('mousedown', onMouseDown);

      return {
        dom: container,
        destroy: () => {
          handle.removeEventListener('mousedown', onMouseDown);
        },
      };
    };
  },
});

interface PostEditorProps {
  initialTitle?: string;
  initialContent?: string;
  postId?: number;
  user: User | null;
  onSubmit?: (title: string, content: string) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export default function PostEditor({ initialTitle = '', initialContent = '', postId, user, onSubmit, onDelete }: PostEditorProps) {
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
      CustomCodeBlock.configure({
        HTMLAttributes: {
          class: 'code-block',
        },
      }),
      ResizableImage.configure({
        inline: true,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: 'ここに記事を書いてください...',
      }),
    ],
    content: initialContent,
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
  });

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  useEffect(() => {
    async function loadDraft() {
      if (user && !postId) {
        try {
          const drafts = await getDraft(user.id);
          if (drafts.length > 0) {
            const latestDraft = drafts[0];
            setTitle(latestDraft.title);
            setContent(latestDraft.content);
            if (editor && !editor.isDestroyed) {
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

  const handleDeleteDraft = async () => {
    if (user && !postId) {
      if (window.confirm('下書きを削除してもよろしいですか？この操作は取り消せません。')) {
        try {
          await deleteDraft(user.id);
          setTitle('');
          setContent('');
          if (editor) {
            editor.commands.setContent('');
          }
          setLastSavedAt(null);
          setHasUnsavedChanges(false);
          localStorage.removeItem('draftTitle');
          localStorage.removeItem('draftContent');
          alert('下書きが削除されました。');
        } catch (error) {
          console.error('下書きの削除中にエラーが発生しました:', error);
          alert('下書きの削除中にエラーが発生しました。');
        }
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
          // 投稿成功後に下書きをクリア
          await deleteDraft(user.id);
          setHasUnsavedChanges(false);
          localStorage.removeItem('draftTitle');
          localStorage.removeItem('draftContent');
        } else {
          const newPost = await createPost({
            title: title,
            content: editor.getHTML(),
          });
          if (newPost) {
            await deleteDraft(user.id);
            setHasUnsavedChanges(false);
            localStorage.removeItem('draftTitle');
            localStorage.removeItem('draftContent');
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
    try {
      const imageUrl = await uploadImage(file);
      if (process.env.NODE_ENV !== 'production') {
        console.log('Received image URL:', imageUrl); // デバッグ用（開発環境のみ）
      }

      if (!imageUrl) {
        throw new Error('画像URLが取得できませんでした');
      }

      if (editor && !editor.isDestroyed) {
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
        toast.success('画像がアップロードされました');
      } else {
        throw new Error('エディターが初期化されていないか、破棄されています');
      }
    } catch (error) {
      console.error('画像のアップロードに失敗しました:', error);
      toast.error(`画像のアップロードに失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  };

  const getWordCount = useCallback(() => {
    if (editor) {
      const text = editor.state.doc.textContent
      return text.length
    }
    return 0
  }, [editor])

  const handleDeletePost = async () => {
    if (postId && window.confirm('この記事を削除してもよろしいですか？この操作は取り消せません。')) {
      try {
        await deletePost(postId);
        if (onDelete) {
          await onDelete();
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('記事の削除中にエラーが発生しました:', error);
        setError('記事の削除中にエラーが発生しました。');
      }
    }
  };

  const handleGoBack = () => {
    if (hasUnsavedChanges) {
      const confirmMessage = '変更が保存されていません。このページを離れてもよろしいですか？';
      if (window.confirm(confirmMessage)) {
        router.back();
      }
    } else {
      router.back();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={handleGoBack}
            className="mr-4 text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            <FiArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold flex items-center">
            <FiEdit className="mr-2" />
            {postId ? '記事編集' : '新しい記事を作成'}
          </h1>
        </div>
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
                <button
                  type="button"
                  onClick={handleDeleteDraft}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center"
                >
                  <FiTrash2 className="mr-2" />
                  下書き削除
                </button>
              </>
            )}
            {postId && (
              <button
                type="button"
                onClick={handleDeletePost}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center"
              >
                <FiAlertTriangle className="mr-2" />
                記事を削除
              </button>
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
        .code-block {
          position: relative;
        }

        .language-select {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background-color: #2d3748;
          color: #e2e8f0;
          border: 1px solid #4a5568;
          border-radius: 0.25rem;
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          outline: none;
        }

        .language-select:focus {
          border-color: #63b3ed;
        }

        .ProseMirror pre {
          padding-top: 2.5rem;
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