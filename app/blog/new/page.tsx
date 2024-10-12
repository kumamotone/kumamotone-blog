'use client'

import PostEditor from '@/app/components/PostEditor'
import { createPost } from '@/lib/posts'
import { getCurrentUser } from '@/lib/supabase'
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function NewPost() {
  const [user, setUser] = useState<User | null>(null);
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
      </div>
      <PostEditor user={user} onSubmit={handleSubmit} />
    </div>
  );
}
