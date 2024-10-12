'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase';
import PostEditor from '@/app/components/PostEditor';
import { createPost } from '@/lib/posts'

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
      // 投稿作成後のリダイレクトなどの処理
      router.push(`/blog/${post.id}`);
    }
  };

  return <PostEditor user={user} onSubmit={handleSubmit} />;
}
