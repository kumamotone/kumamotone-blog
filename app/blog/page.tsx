'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { getAllPosts, Post } from "@/lib/posts";
import { getCurrentUser, signOut } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/2"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  );
}

export default function BlogList() {
  const [user, setUser] = useState<User | null>(null);
  const [blogPosts, setBlogPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        const [currentUser, posts] = await Promise.all([
          getCurrentUser(),
          getAllPosts()
        ]);
        setUser(currentUser);
        setBlogPosts(posts);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center">ブログ記事一覧</h1>
        <div className="space-y-8">
          {[...Array(5)].map((_, i) => (
            <LoadingSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-center">ブログ記事一覧</h1>
      <div className="mb-8 flex justify-between items-center">
        {user ? (
          <div className="flex items-center space-x-4">
            <p className="text-lg">ようこそ、{user.email}さん！</p>
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
        {user && (
          <Link href="/blog/new" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition duration-300">
            新しい記事を作成
          </Link>
        )}
        {user && (
          <Link href="/drafts" className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition duration-300 ml-4">
            下書き一覧
          </Link>
        )}
      </div>
      {blogPosts.length === 0 ? (
        <p className="text-center text-gray-500">記事がありません。</p>
      ) : (
        <ul className="space-y-6">
          {blogPosts.map((post) => (
            <li key={post.id} className="border-b pb-4">
              <Link href={`/blog/${post.id}`} className="text-xl font-semibold text-blue-600 hover:underline">
                {post.title}
              </Link>
              <p className="text-gray-500 text-sm mt-1">{post.date}</p>
              {user && (
                <Link href={`/blog/edit/${post.id}`} className="text-sm text-blue-500 hover:underline mt-2 inline-block">
                  編集
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
      <Link href="/" className="text-blue-500 hover:underline mt-8 inline-block">
        ホームに戻る
      </Link>
    </div>
  );
}
