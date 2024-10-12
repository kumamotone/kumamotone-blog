'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase';
import PostEditor from '@/app/components/PostEditor';
import { createPost } from '@/lib/posts'
import Link from 'next/link';

export default function NewPost() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkUser() {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setIsLoading(false);
      if (!currentUser) {
        router.push('/login');
      }
    }
    checkUser();
  }, [router]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    return null;
  }

  const handleSubmit = async (title: string, content: string) => {
    const post = await createPost({ title, content });
    if (post) {
      router.push('/');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">新しい記事を作成</h1>
        <Link href="/drafts" className="text-blue-500 hover:underline">
          下書き一覧
        </Link>
      </div>
      <PostEditor user={user} onSubmit={handleSubmit} />
    </div>
  );
}
