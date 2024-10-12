'use client'

import { getPostById, getPreviousAndNextPost, Post } from "@/lib/posts"
import { getCurrentUser } from "@/lib/supabase"
import { User } from "@supabase/supabase-js"
import DOMPurify from 'dompurify'
import Link from "next/link"
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-typescript'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { FiArrowLeft, FiArrowRight, FiEdit, FiHome, FiTwitter } from 'react-icons/fi'

export default function BlogPost({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<Post | null>(null);
  const [prevPost, setPrevPost] = useState<Post | null>(null);
  const [nextPost, setNextPost] = useState<Post | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const [loadedPost, { prev, next }, currentUser] = await Promise.all([
          getPostById(parseInt(params.id)),
          getPreviousAndNextPost(parseInt(params.id)),
          getCurrentUser()
        ]);
        setPost(loadedPost);
        setPrevPost(prev);
        setNextPost(next);
        setUser(currentUser);
      } catch (err) {
        console.error('Error loading post data:', err);
        setError('記事の読み込み中にエラーが発生しました。');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [params.id]);

  useEffect(() => {
    if (typeof window !== 'undefined' && post) {
      Prism.highlightAll();
    }
  }, [post]);

  const handleTweet = useCallback((post: Post) => {
    const tweetText = encodeURIComponent(`${post.title} | 熊小屋`);
    const tweetUrl = encodeURIComponent(`${window.location.origin}/blog/${post.id}`);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`, '_blank');
  }, []);

  const sanitizedContent = useMemo(() => {
    return post ? DOMPurify.sanitize(post.content, {
      ALLOWED_TAGS: ['p', 'strong', 'em', 'u', 's', 'a', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'img', 'pre', 'code'],
      ALLOWED_ATTR: ['href', 'target', 'src', 'alt', 'width', 'height', 'class']
    }) : '';
  }, [post]);

  if (isLoading) {
    return <div className="text-center py-8">記事を読み込んでいます...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-8">{error}</div>;
  }

  if (!post) {
    return <div className="text-center py-8">記事が見つかりません。</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Link href="/" className="text-green-600 hover:underline flex items-center">
          <FiHome className="mr-2" />
          ホームに戻る
        </Link>
      </div>

      <article className="mb-12">
        <h1 className="text-4xl font-bold mb-4 text-green-800">{post.title}</h1>
        <p className="text-gray-500 text-sm mb-4">
          {new Date(post.created_at).toLocaleString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
        <div 
          className="text-gray-700 prose prose-green max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
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

      <nav className="flex justify-between items-center mt-8">
        {prevPost && (
          <Link href={`/blog/${prevPost.id}`} className="text-green-600 hover:underline flex items-center">
            <FiArrowLeft className="mr-2" />
            {prevPost.title}
          </Link>
        )}
        {nextPost && (
          <Link href={`/blog/${nextPost.id}`} className="text-green-600 hover:underline flex items-center ml-auto">
            {nextPost.title}
            <FiArrowRight className="ml-2" />
          </Link>
        )}
      </nav>
    </div>
  );
}