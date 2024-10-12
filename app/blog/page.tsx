'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { getAllPosts, Post } from "@/lib/posts";
import { getCurrentUser, signOut } from "@/lib/supabase";

export default function BlogList() {
  const [user, setUser] = useState<any>(null);
  const [blogPosts, setBlogPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      const posts = await getAllPosts();
      setBlogPosts(posts);
      setIsLoading(false);
    }

    loadData();
  }, []);

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    router.push('/');
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">ブログ記事一覧</h1>
      {user && (
        <div className="mb-4">
          <p>ようこそ、{user.email}さん！</p>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 mt-2"
          >
            ログアウト
          </button>
        </div>
      )}
      {user && (
        <Link href="/blog/new" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4 inline-block">
          新しい記事を作成
        </Link>
      )}
      {!user && (
        <Link href="/login" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4 inline-block">
          ログイン
        </Link>
      )}
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
              {user && (
                <Link href={`/blog/edit/${post.id}`} className="text-sm text-blue-500 hover:underline ml-2">
                  編集
                </Link>
              )}
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
