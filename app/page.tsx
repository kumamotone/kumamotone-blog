'use client'

import { getPaginatedPosts, Post } from "@/lib/posts"
import { getCurrentUser } from "@/lib/supabase"
import { User } from "@supabase/supabase-js"
import DOMPurify from 'dompurify'
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import React, { useEffect, useState } from 'react'

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-400 rounded w-1/2"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-400 rounded w-5/6"></div>
        <div className="h-4 bg-gray-400 rounded w-full"></div>
        <div className="h-4 bg-gray-400 rounded w-4/6"></div>
      </div>
    </div>
  );
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [blogPosts, setBlogPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPosts, setTotalPosts] = useState(0);
  const postsPerPage = 5;

  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams?.get('page')) || 1;

  useEffect(() => {
    async function loadData() {
      try {
        const [currentUser, { posts, total }] = await Promise.all([
          getCurrentUser(),
          getPaginatedPosts(currentPage, postsPerPage)
        ]);
        setUser(currentUser);
        setBlogPosts(posts);
        setTotalPosts(total);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [currentPage]);

  const totalPages = Math.ceil(totalPosts / postsPerPage);

  const handlePageChange = (newPage: number) => {
    router.push(`/?page=${newPage}`);
  };

  const handleTweet = (post: Post) => {
    const tweetText = encodeURIComponent(`${post.title} | 山蔭の熊小屋`);
    const tweetUrl = encodeURIComponent(`${window.location.origin}/blog/${post.id}`);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`, '_blank');
  };

  const generatePagination = (current: number, total: number) => {
    const delta = 2;
    const left = current - delta;
    const right = current + delta + 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= total; i++) {
      if (i === 1 || i === total || (i >= left && i < right)) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl bg-gray-100">
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">山蔭の熊小屋</h1>
        <div className="space-y-8">
          {[...Array(5)].map((_, i) => (
            <LoadingSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">山蔭の熊小屋</h1>
        {user && (
          <div className="mb-8 flex justify-end">
            <Link href="/blog/new" className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 transition duration-300">
              新しい記事を作成
            </Link>
          </div>
        )}
        {blogPosts.length === 0 ? (
          <p className="text-center text-gray-600">記事がありません。</p>
        ) : (
          <ul className="space-y-12">
            {blogPosts.map((post) => (
              <li key={post.id} className="border-b border-gray-300 pb-8">
                <Link href={`/blog/${post.id}`} className="text-2xl font-semibold text-teal-700 hover:underline">
                  {post.title}
                </Link>
                <p className="text-gray-500 text-sm mt-2">
                  {new Date(post.created_at).toLocaleString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <div 
                  className="text-gray-700 mt-4 mb-4 prose"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(post.content, {
                      ALLOWED_TAGS: ['p', 'strong', 'em', 'u', 's', 'a', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'img'],
                      ALLOWED_ATTR: ['href', 'target', 'src', 'alt', 'width', 'height']
                    })
                  }}
                />
                {user && (
                  <div className="mt-4 flex items-center space-x-4">
                    <Link href={`/blog/edit/${post.id}`} className="text-teal-600 hover:underline">
                      編集
                    </Link>
                    <button
                      onClick={() => handleTweet(post)}
                      className="text-blue-500 hover:text-blue-600"
                    >
                      X に投稿
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <footer className="mt-12 pt-4 border-t border-gray-300">
          <nav className="flex justify-center items-center space-x-2">
            {generatePagination(currentPage, totalPages).map((page, index) => (
              <React.Fragment key={index}>
                {page === '...' ? (
                  <span className="px-3 py-2 text-gray-500">...</span>
                ) : (
                  <button
                    onClick={() => handlePageChange(Number(page))}
                    className={`px-3 py-2 rounded ${
                      currentPage === page
                        ? 'bg-teal-600 text-white'
                        : 'bg-white text-teal-600 hover:bg-teal-100'
                    }`}
                  >
                    {page}
                  </button>
                )}
              </React.Fragment>
            ))}
          </nav>
        </footer>
      </div>
    </div>
  );
}
