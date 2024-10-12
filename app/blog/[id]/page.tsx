'use client'

import { useState, useEffect } from 'react'
import { getPostById } from "@/lib/posts"
import dynamic from 'next/dynamic'

const Prism = dynamic(() => import('prismjs'), { ssr: false })

export default function BlogPost({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<any>(null);

  useEffect(() => {
    async function loadPost() {
      const loadedPost = await getPostById(parseInt(params.id));
      setPost(loadedPost);
    }
    loadPost();
  }, [params.id]);

  useEffect(() => {
    if (typeof window !== 'undefined' && post) {
      import('prismjs').then((Prism) => {
        import('prismjs/components/prism-javascript');
        import('prismjs/components/prism-typescript');
        // 他の必要な言語も同様にインポート
        Prism.highlightAll();
      });
    }
  }, [post]);

  if (!post) {
    return <div>記事を読み込んでいます...</div>;
  }

  return (
    <article className="prose lg:prose-xl">
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
