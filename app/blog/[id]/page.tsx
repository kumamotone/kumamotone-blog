'use client'

import { getPostById, getPreviousAndNextPost, Post } from "@/lib/posts"
import { getCurrentUser } from "@/lib/supabase"
import { User } from "@supabase/supabase-js"
import DOMPurify from 'dompurify'
import Link from "next/link"
import { useEffect, useState } from 'react'
// import Prism from 'prismjs'
// import 'prismjs/components/prism-javascript'
// import 'prismjs/components/prism-typescript'

export default function BlogPost({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<Post | null>(null);
  const [prevPost, setPrevPost] = useState<Post | null>(null);
  const [nextPost, setNextPost] = useState<Post | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function loadData() {
      const [loadedPost, { prev, next }, currentUser] = await Promise.all([
        getPostById(parseInt(params.id)),
        getPreviousAndNextPost(parseInt(params.id)),
        getCurrentUser()
      ]);
      setPost(loadedPost);
      setPrevPost(prev);
      setNextPost(next);
      setUser(currentUser);
    }
    loadData();
  }, [params.id]);

  useEffect(() => {
    if (typeof window !== 'undefined' && post) {
      import('prismjs').then((Prism) => {
        import('prismjs/components/prism-javascript');
        import('prismjs/components/prism-typescript');
        Prism.highlightAll();
      }).catch(error => {
        console.error('Prismのインポートエラー:', error);
      });
    }
  }, [post]);

  const handleTweet = (post: Post) => {
    const tweetText = encodeURIComponent(`${post.title} | 山蔭の熊小屋`);
    const tweetUrl = encodeURIComponent(`${window.location.origin}/blog/${post.id}`);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`, '_blank');
  };

  if (!post) {
    return <div>記事を読み込んでいます...</div>;
  }

  return (
    <div>
      <nav className="flex justify-between items-center mb-4">
        {prevPost && (
          <Link href={`/blog/${prevPost.id}`} className="text-green-600 hover:underline">
            ← 前の記事
          </Link>
        )}
        <Link href="/" className="text-green-600 hover:underline">
          ホームに戻る
        </Link>
        {nextPost && (
          <Link href={`/blog/${nextPost.id}`} className="text-green-600 hover:underline">
            次の記事 →
          </Link>
        )}
      </nav>

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

      <article className="prose prose-lg max-w-none mb-8">
        <div 
          dangerouslySetInnerHTML={{ 
            __html: DOMPurify.sanitize(post.content, {
              ALLOWED_TAGS: ['p', 'strong', 'em', 'u', 's', 'a', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'img', 'pre', 'code'],
              ALLOWED_ATTR: ['href', 'target', 'src', 'alt', 'width', 'height', 'class']
            })
          }} 
        />
      </article>

      <div className="flex justify-between items-center mt-8">
        {user && (
          <Link href={`/blog/edit/${post.id}`} className="text-green-600 hover:underline">
            編集
          </Link>
        )}
        <button
          onClick={() => handleTweet(post)}
          className="text-blue-500 hover:text-blue-600"
        >
          X に投稿
        </button>
        <a href="#top" className="text-green-600 hover:underline">
          ページ上部へ
        </a>
      </div>

      <nav className="flex justify-between items-center mt-8">
        {prevPost && (
          <Link href={`/blog/${prevPost.id}`} className="text-green-600 hover:underline">
            ← {prevPost.title}
          </Link>
        )}
        {nextPost && (
          <Link href={`/blog/${nextPost.id}`} className="text-green-600 hover:underline">
            {nextPost.title} →
          </Link>
        )}
      </nav>
    </div>
  );
}
