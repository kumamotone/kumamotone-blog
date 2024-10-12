'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase';
import { getPostById } from '@/lib/posts';
import PostEditor from '@/app/components/PostEditor';

export default function EditPost({ params }: { params: { id: string } }) {
  const [user, setUser] = useState(null);
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const id = parseInt(params.id);

  useEffect(() => {
    async function loadData() {
      const [currentUser, loadedPost] = await Promise.all([
        getCurrentUser(),
        getPostById(id)
      ]);
      setUser(currentUser);
      setPost(loadedPost);
      setIsLoading(false);
      if (!currentUser) {
        router.push('/login');
      }
    }
    loadData();
  }, [id, router]);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user || !post) {
    return null;
  }

  return <PostEditor user={user} initialTitle={post.title} initialContent={post.content} postId={id} />;
}
