'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllPosts, Post } from "@/lib/posts";
import { getCurrentUser } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import DOMPurify from 'dompurify';

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
          <Link href="/blog/new" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-300">
            新しい記事を作成
          </Link>
        </div>
      )}
      {blogPosts.length === 0 ? (
        <p className="text-center text-gray-500">記事がありません。</p>
      ) : (
        <ul className="space-y-8">
          {blogPosts.map((post) => (
            <li key={post.id} className="border-b pb-8">
              <Link href={`/blog/${post.id}`} className="text-2xl font-semibold text-blue-600 hover:underline">
                {post.title}
              </Link>
              <p className="text-gray-500 text-sm mt-2">{post.date}</p>
              <div 
                className="text-gray-700 mt-4 mb-4 prose"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(post.content.substring(0, 300) + (post.content.length > 300 ? '...' : ''), {
                    ALLOWED_TAGS: ['p', 'strong', 'em', 'u', 's', 'a', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'img'],
                    ALLOWED_ATTR: ['href', 'target', 'src', 'alt', 'width', 'height']
                  })
                }}
              />
              <div className="mt-4 flex items-center space-x-4">
                <Link href={`/blog/${post.id}`} className="text-blue-500 hover:underline">
                  続きを読む
                </Link>
                {user && (
                  <Link href={`/blog/edit/${post.id}`} className="text-gray-500 hover:underline">
                    編集
                  </Link>
                )}
              </div>
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
