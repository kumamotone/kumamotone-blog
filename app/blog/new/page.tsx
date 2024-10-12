'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createPost, saveDraft, getDraft, deleteDraft } from '@/lib/posts';
import { getCurrentUser } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

export default function NewPost() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkUserAndLoadDraft() {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setIsLoading(false);
      if (!currentUser) {
        router.push('/login');
      } else {
        const draft = await getDraft(currentUser.id);
        if (draft) {
          setTitle(draft.title);
          setContent(draft.content);
        }
      }
    }
    checkUserAndLoadDraft();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!user) {
      setError('ログインが必要です。');
      return;
    }
    const result = await createPost({ title, content });
    if (result) {
      await deleteDraft(user.id);
      router.push('/blog');
    } else {
      setError('記事の作成に失敗しました。');
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

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
      ['link', 'image'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image'
  ];

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">新しい記事を作成</h1>
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
            theme="snow"
            value={content}
            onChange={setContent}
            modules={modules}
            formats={formats}
            className="h-64 mb-12"
          />
        </div>
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleSaveDraft}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            disabled={isSaving}
          >
            {isSaving ? '保存中...' : '下書き保存'}
          </button>
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            投稿する
          </button>
        </div>
      </form>
    </div>
  );
}
