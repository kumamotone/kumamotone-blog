'use client'

import { getPaginatedPosts, Post } from "@/lib/posts"
import { getCurrentUser } from "@/lib/supabase"
import { User } from "@supabase/supabase-js"
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-light.css'; // または他の好みのスタイル
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import React, { useEffect, useState } from 'react'
import { renderToString } from 'react-dom/server'
import { FiArrowUp, FiEdit, FiTwitter } from 'react-icons/fi'

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [blogPosts, setBlogPosts] = useState<Post[] | null>(null);
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
        setBlogPosts([]);  // エラー時は空の配列をセット
      }
    }

    loadData();
  }, [currentPage]);

  const totalPages = Math.ceil(totalPosts / postsPerPage);

  const handlePageChange = (newPage: number) => {
    router.push(`/?page=${newPage}`);
  };

  const handleTweet = (post: Post) => {
    const tweetText = encodeURIComponent(`${post.title} | 熊小屋`);
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

  const renderContent = (content: string) => {
    const sanitizedContent = DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['p', 'strong', 'em', 'u', 's', 'a', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'img', 'pre', 'code'],
      ALLOWED_ATTR: ['href', 'target', 'src', 'alt', 'width', 'height', 'class']
    });

    const parser = new DOMParser();
    const doc = parser.parseFromString(sanitizedContent, 'text/html');
    const elements = Array.from(doc.body.childNodes);

    return elements.map((element, index) => {
      if (element instanceof HTMLElement && element.nodeName === 'PRE' && element.firstChild instanceof HTMLElement && element.firstChild.nodeName === 'CODE') {
        const code = element.textContent || '';
        const language = element.firstChild.className.replace('language-', '') || 'plaintext';
        const highlightedCode = hljs.highlight(code, { language }).value;
        const html = renderToString(
          <pre>
            <code className={`hljs language-${language}`} dangerouslySetInnerHTML={{ __html: highlightedCode }} />
          </pre>
        );
        return <div key={index} dangerouslySetInnerHTML={{ __html: html }} />;
      }
      if (element instanceof HTMLElement) {
        return <div key={index} dangerouslySetInnerHTML={{ __html: element.outerHTML }} />;
      }
      return null;
    });
  };

  if (blogPosts === null) {
    return null;  // データ読み込み中は何も表示しない
  }

  return (
    <div className="pb-12 relative">
      {user && (
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
      {blogPosts.length === 0 ? (
        <p className="text-gray-600">記事がありません。</p>
      ) : (
        <div className="space-y-12">
          {blogPosts.map((post, index) => (
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
                {user && (
                  <div className="mt-6 flex items-center space-x-4">
                    <Link href={`/blog/edit/${post.id}`} className="text-green-600 hover:underline flex items-center">
                      <FiEdit className="mr-2" />
                      編集
                    </Link>
                    <button
                      onClick={() => handleTweet(post)}
                      className="text-blue-500 hover:text-blue-600 flex items-center"
                    >
                      <FiTwitter className="mr-2" />
                      X に投稿
                    </button>
                  </div>
                )}
              </article>
              {index < blogPosts.length - 1 && (
                <hr className="border-t border-gray-300" />
              )}
            </React.Fragment>
          ))}
        </div>
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
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-green-600 hover:bg-green-100'
                  }`}
                >
                  {page}
                </button>
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
