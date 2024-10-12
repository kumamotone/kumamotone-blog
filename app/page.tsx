'use client'

import { useState, useEffect } from 'react';
import Link from "next/link";
import { getAllPosts, Post } from "@/lib/posts";

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const fetchedPosts = await getAllPosts();
      setPosts(fetchedPosts);
      setIsLoading(false);
    }
    loadData();
  }, []);

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">My Blog</h1>
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
