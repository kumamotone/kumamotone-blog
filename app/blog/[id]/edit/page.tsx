'use client'

import PostEditor from '@/app/components/PostEditor'
import { getPostById, updatePost } from '@/lib/posts'
import { getCurrentUser } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function EditPost({ params }: { params: { id: string } }) {
  // ... 既存の状態と関数

  const handleDelete = async () => {
    router.push('/');
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

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
