'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { getAllPosts } from "@/lib/posts";
import { getCurrentUser } from "@/lib/supabase";

export default function BlogList() {
  const [user, setUser] = useState(null);
  const [blogPosts, setBlogPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        console.log('User not authenticated, redirecting to login');
        router.push('/login');
        return;
      }
      setUser(currentUser);

      const posts = await getAllPosts();
      setBlogPosts(posts);
      setIsLoading(false);
    }

    loadData();
  }, [router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">ブログ記事一覧</h1>
      {user && <p>ようこそ、{user.email}さん！</p>}
      <Link href="/blog/new" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4 inline-block">
        新しい記事を作成
      </Link>
      {blogPosts.length === 0 ? (
        <p>記事がありません。</p>
      ) : (
        <ul>
          {blogPosts.map((post) => (
            <li key={post.id} className="mb-4">
              <Link href={`/blog/${post.id}`} className="text-blue-500 hover:underline">
                <h2 className="text-xl font-semibold">{post.title}</h2>
              </Link>
              <p className="text-gray-500">{post.date}</p>
              <Link href={`/blog/edit/${post.id}`} className="text-sm text-blue-500 hover:underline ml-2">
                編集
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link href="/" className="text-blue-500 hover:underline">
        ホームに戻る
      </Link>
    </div>
  );
}
