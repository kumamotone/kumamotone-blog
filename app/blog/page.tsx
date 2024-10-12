'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllPosts, Post } from "@/lib/posts";
import { getCurrentUser } from "@/lib/supabase";
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
      {user && (
        <div className="mb-8 flex justify-end">
          <Link href="/blog/new" className="text-sm text-gray-600 hover:underline">
            新しい記事を作成
          </Link>
        </div>
      )}
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
                <Link href={`/blog/edit/${post.id}`} className="text-sm text-gray-600 hover:underline mt-2 inline-block">
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
