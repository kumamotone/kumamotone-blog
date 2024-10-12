'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import CodeBlock from '@tiptap/extension-code-block';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { Node, mergeAttributes } from '@tiptap/core';
import { createPost, deleteDraft, getDraft, saveDraft, updatePost } from '@/lib/posts';
import { User } from '@supabase/supabase-js';
import { uploadImage } from '@/lib/supabase';

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

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
      },
      height: {
        default: null,
      },
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
      CustomImage.configure({
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
        const draft = await getDraft(user.id);
        if (draft) {
          setTitle(draft.title);
          editor?.commands.setContent(draft.content);
        }
      }
    }
    loadDraft();
  }, [user, postId, editor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!user) {
      setError('ログインが必要です。');
      return;
    }
    const content = editor?.getHTML() || '';
    let result;
    if (postId) {
      result = await updatePost(postId, { title, content });
    } else {
      result = await createPost({ title, content });
    }
    if (result) {
      if (!postId) {
        await deleteDraft(user.id);
      }
      router.push('/blog');
    } else {
      setError(postId ? '記事の更新に失敗しました。' : '記事の作成に失敗しました。');
    }
  };

  const handleSaveDraft = useCallback(async () => {
    if (!user) return;
    setIsSaving(true);
    const content = editor?.getHTML() || '';
    const draft = await saveDraft({ title, content, user_id: user.id });
    setIsSaving(false);
    if (draft) {
      alert('下書きを保存しました。');
    } else {
      setError('下書きの保存に失敗しました。');
    }
  }, [user, title, editor]);

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
      <h1 className="text-3xl font-bold mb-6">{postId ? '記事を編集' : '新しい記事を作成'}</h1>
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
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            {postId ? '更新する' : '投稿する'}
          </button>
        </div>
      </form>
    </div>
  );
}
