'use client'

import { getPostById, Post } from "@/lib/posts"
import { useEffect, useState } from 'react'

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
    return <div>記事を読み込んでいます...</div>;
  }

  return (
    <article className="prose lg:prose-xl">
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
