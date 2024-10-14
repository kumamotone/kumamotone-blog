'use client'

import { getPostById, Post } from "@/lib/posts"
import { getCurrentUser } from "@/lib/supabase"
import { User } from "@supabase/supabase-js"
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-light.css'
import Link from "next/link"
import { useEffect, useState } from "react"
import { renderToString } from 'react-dom/server'
import { FiEdit, FiTwitter } from 'react-icons/fi'

export default function BlogPost({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<User | null>(null);
  const [post, setPost] = useState<Post | null>(null);

  useEffect(() => {
    async function loadData() {
      const id = parseInt(params.id);
      const [currentUser, loadedPost] = await Promise.all([
        getCurrentUser(),
        getPostById(id)
      ]);
      setUser(currentUser);
      setPost(loadedPost);
    }
    loadData();
  }, [params.id]);

  const handleTweet = () => {
    if (post) {
      const tweetText = encodeURIComponent(`${post.title} | 熊小屋`);
      const tweetUrl = encodeURIComponent(`${window.location.origin}/blog/${post.id}`);
      window.open(`https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`, '_blank');
    }
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

  if (!post) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-green-800 mb-4">{post.title}</h1>
      <p className="text-gray-600 mb-6">
        {new Date(post.created_at).toLocaleString('ja-JP', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </p>
      <div className="prose prose-green max-w-none mb-8">
        {renderContent(post.content)}
      </div>
      <div className="flex items-center space-x-4">
        {user && (
          <Link href={`/blog/edit/${post.id}`} className="text-green-600 hover:underline flex items-center">
            <FiEdit className="mr-2" />
            編集
          </Link>
        )}
        <button
          onClick={handleTweet}
          className="text-blue-500 hover:text-blue-600 flex items-center"
        >
          <FiTwitter className="mr-2" />
          X に投稿
        </button>
      </div>
      <div className="mt-8">
        <Link href="/" className="text-green-600 hover:underline">
          ← ホームに戻る
        </Link>
      </div>
    </div>
  );
}
