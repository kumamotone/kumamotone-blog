'use client'

import { getPostById, Post } from "@/lib/posts"
import { useEffect, useState } from 'react'
import DOMPurify from 'dompurify'

export default function BlogPost({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<Post | null>(null);

  useEffect(() => {
    async function loadPost() {
      const loadedPost = await getPostById(parseInt(params.id));
      setPost(loadedPost);
    }
    loadPost();
  }, [params.id]);

  useEffect(() => {
    if (typeof window !== 'undefined' && post) {
      Promise.all([
        import('prismjs'),
        import('prismjs/components/prism-javascript'),
        import('prismjs/components/prism-typescript'),
        // 他の必要な言語も同様にインポート
      ]).then(([Prism]) => {
        Prism.highlightAll();
      }).catch(error => {
        console.error('Prismのインポートエラー:', error);
      });
    }
  }, [post]);

  if (!post) {
    return <div className="p-4">記事を読み込んでいます...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-4xl font-bold mb-4 text-green-800">{post.title}</h1>
      <p className="text-gray-500 text-sm mb-8">
        {new Date(post.created_at).toLocaleString('ja-JP', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </p>
      <article className="prose prose-lg max-w-none">
        <div 
          dangerouslySetInnerHTML={{ 
            __html: DOMPurify.sanitize(post.content, {
              ALLOWED_TAGS: ['p', 'strong', 'em', 'u', 's', 'a', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'img', 'pre', 'code'],
              ALLOWED_ATTR: ['href', 'target', 'src', 'alt', 'width', 'height', 'class']
            })
          }} 
        />
      </article>
    </div>
  );
}
