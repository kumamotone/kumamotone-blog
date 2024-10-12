'use client'

import { useState, useEffect } from 'react';
import Link from "next/link";
import { getAllPosts, Post } from "@/lib/posts";
import { getCurrentUser, signOut } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [fetchedPosts, currentUser] = await Promise.all([
        getAllPosts(),
        getCurrentUser()
      ]);
      setPosts(fetchedPosts);
      setUser(currentUser);
      setIsLoading(false);
    }
    loadData();
  }, []);

  const handleLogout = async () => {
    await signOut();
    setUser(null);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">My Blog</h1>
          <div>
            {user ? (
              <div className="flex items-center space-x-4">
                <span>ようこそ、{user.email}さん！</span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-300"
                >
                  ログアウト
                </button>
              </div>
            ) : (
              <Link href="/login" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300">
                ログイン
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">最新の記事</h2>
          <div className="space-y-6">
            {posts.slice(0, 5).map((post) => (
              <div key={post.id} className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-6">
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    <Link href={`/blog/${post.id}`} className="hover:underline">
                      {post.title}
                    </Link>
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">{post.date}</p>
                  <div className="text-gray-700 mb-4">
                    {post.content.substring(0, 200)}
                    {post.content.length > 200 ? '...' : ''}
                  </div>
                  <Link
                    href={`/blog/${post.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    続きを読む
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/blog"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-300"
            >
              すべての記事を見る
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
