'use client'

import { getPostById, Post, updatePost } from "@/lib/posts"
import { getCurrentUser } from "@/lib/supabase"
import { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import PostEditor from "@/app/components/PostEditor"

export default function EditPost({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<User | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      const id = parseInt(params.id);
      const [currentUser, loadedPost] = await Promise.all([
        getCurrentUser(),
        getPostById(id)
      ]);
      setUser(currentUser);
      setPost(loadedPost);
      setIsLoading(false);
    }
    loadData();
  }, [params.id]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user || !post) {
    return <div>記事が見つからないか、アクセス権限がありません。</div>;
  }

  const handleSubmit = async (title: string, content: string) => {
    const updatedPost = await updatePost(post.id, { title, content });
    if (updatedPost) {
      router.push(`/blog/${updatedPost.id}`);
    }
  };

  return (
    <PostEditor
      initialTitle={post.title}
      initialContent={post.content}
      postId={post.id}
      user={user}
      onSubmit={handleSubmit}
    />
  );
}
