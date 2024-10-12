'use client'

import PostEditor from '@/app/components/PostEditor'
import { getPostById, updatePost } from '@/lib/posts'
import { getCurrentUser } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function EditPost({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<User | null>(null);
  const [post, setPost] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      const [currentUser, loadedPost] = await Promise.all([
        getCurrentUser(),
        getPostById(parseInt(params.id))
      ]);
      setUser(currentUser);
      setPost(loadedPost);
    }
    loadData();
  }, [params.id]);

  const handleSubmit = async (title: string, content: string) => {
    if (post) {
      const updatedPost = await updatePost(post.id, { title, content });
      if (updatedPost) {
        router.push(`/blog/${updatedPost.id}`);
      }
    }
  };

  const handleDelete = async () => {
    router.push('/');
  };

  if (!user || !post) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PostEditor
        initialTitle={post.title}
        initialContent={post.content}
        postId={post.id}
        user={user}
        onSubmit={handleSubmit}
        onDelete={handleDelete}
      />
    </div>
  );
}
