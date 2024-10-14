import { renderContent } from '@/app/components/PostContent'
import { getPaginatedPosts } from "@/lib/posts"
import { getCurrentUser } from "@/lib/supabase"
import Link from "next/link"
import React from 'react'
import { FiArrowUp, FiEdit, FiTwitter } from 'react-icons/fi'

export default async function Home({ searchParams }: { searchParams: { page?: string } }) {
  const currentPage = Number(searchParams.page) || 1;
  const postsPerPage = 5;

  const [currentUser, { posts, total }] = await Promise.all([
    getCurrentUser(),
    getPaginatedPosts(currentPage, postsPerPage)
  ]);

  const totalPages = Math.ceil(total / postsPerPage);

  const generatePagination = () => {
    const delta = 2;
    const left = currentPage - delta;
    const right = currentPage + delta + 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i < right)) {
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

  const handleTweet = (postId: number, title: string) => {
    const tweetText = encodeURIComponent(`${title} | 熊小屋`);
    const tweetUrl = encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_URL}/blog/${postId}`);
    return `https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`;
  };

  return (
    <div className="pb-12 relative">
      {currentUser && (
        <div className="absolute top-4 right-4">
          <Link href="/blog/new" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition duration-300 flex items-center">
            <FiEdit className="mr-2" />
            新しい記事を作成
          </Link>
        </div>
      )}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-green-800 mb-2">
          熊小屋
        </h1>
        <p className="text-lg text-gray-600 mb-4">I love pure blogs.</p>
        <div className="flex space-x-4 text-sm text-gray-600">
          <a href="https://twitter.com/kumamo_tone" target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-green-600">
            <FiTwitter className="mr-1" />
            @kumamo_tone
          </a>
          <a href="https://kuma.dev/" target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-green-600">
            <span className="mr-1" role="img" aria-label="ホームページ">🏠</span>
            https://kuma.dev/
          </a>
        </div>
      </div>
      {posts.length === 0 ? (
        <p className="text-gray-600">記事がありません。</p>
      ) : (
        <div className="space-y-12">
          {posts.map((post, index) => (
            <React.Fragment key={post.id}>
              <article className="mb-12">
                <h2 className="text-2xl font-semibold text-green-700 hover:underline mb-4">
                  <Link href={`/blog/${post.id}`}>
                    {post.title}
                  </Link>
                </h2>
                <p className="text-gray-500 text-sm mb-4">
                  {new Date(post.created_at).toLocaleString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <div className="text-gray-700 prose prose-green max-w-none">
                  {renderContent(post.content)}
                </div>
                {currentUser && (
                  <div className="mt-6 flex items-center space-x-4">
                    <Link href={`/blog/edit/${post.id}`} className="text-green-600 hover:underline flex items-center">
                      <FiEdit className="mr-2" />
                      編集
                    </Link>
                    <a
                      href={handleTweet(post.id, post.title)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 flex items-center"
                    >
                      <FiTwitter className="mr-2" />
                      X に投稿
                    </a>
                  </div>
                )}
              </article>
              {index < posts.length - 1 && (
                <hr className="border-t border-gray-300" />
              )}
            </React.Fragment>
          ))}
        </div>
      )}
      <footer className="mt-12 pt-4 border-t border-gray-300">
        <nav className="flex justify-center items-center space-x-2">
          {generatePagination().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-3 py-2 text-gray-500">...</span>
              ) : (
                <Link
                  href={`/?page=${page}`}
                  className={`px-3 py-2 rounded ${
                    currentPage === page
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-green-600 hover:bg-green-100'
                  }`}
                >
                  {page}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </footer>
      <a href="#top" className="text-green-600 hover:underline flex items-center justify-center mt-8">
        <FiArrowUp className="mr-2" />
        ページ上部へ
      </a>
    </div>
  );
}
