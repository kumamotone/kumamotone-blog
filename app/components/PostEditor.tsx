'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createPost, updatePost, saveDraft, getDraft, deleteDraft } from '@/lib/posts';
import { uploadImage } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

const ReactQuill = dynamic(() => import('react-quill'), {
  ssr: false,
  loading: () => <p>Loading editor...</p>,
});

import 'react-quill/dist/quill.snow.css';

interface PostEditorProps {
  initialTitle?: string;
  initialContent?: string;
  postId?: number;
  user: User | null;
}

export default function PostEditor({ initialTitle = '', initialContent = '', postId, user }: PostEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const quillRef = useRef<any>(null);

  useEffect(() => {
    async function loadDraft() {
      if (user && !postId) {
        const draft = await getDraft(user.id);
        if (draft) {
          setTitle(draft.title);
          setContent(draft.content);
        }
      }
    }
    loadDraft();
  }, [user, postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!user) {
      setError('ログインが必要です。');
      return;
    }
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

  const handleSaveDraft = async () => {
    if (!user) return;
    setIsSaving(true);
    const draft = await saveDraft({ title, content, user_id: user.id });
    setIsSaving(false);
    if (draft) {
      alert('下書きを保存しました。');
    } else {
      setError('下書きの保存に失敗しました。');
    }
  };

  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        const imageUrl = await uploadImage(file);
        if (imageUrl && quillRef.current) {
          const editor = quillRef.current.getEditor();
          const range = editor.getSelection();
          editor.insertEmbed(range.index, 'image', imageUrl);
        }
      }
    };
  }, []);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: handleImageUpload
      }
    },
  }), [handleImageUpload]);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image'
  ];

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
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={content}
            onChange={setContent}
            modules={modules}
            formats={formats}
            className="h-64 mb-12"
          />
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
