'use client'

import { getAllPosts, Post } from "@/lib/posts"
import Link from "next/link"
import { useEffect, useState } from "react"
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css' // または他のスタイル

export default function BlogList() {
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    async function loadPosts() {
      const allPosts = await getAllPosts()
      setPosts(allPosts)
    }
    loadPosts()
  }, [])

  useEffect(() => {
    if (posts.length > 0) {
      hljs.highlightAll()
    }
  }, [posts])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">山蔭の熊小屋</h1>
      <div className="space-y-12">
        {posts.map((post) => (
          <article key={post.id} className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">
                <Link href={`/blog/${post.id}`} className="text-blue-600 hover:text-blue-800">
                  {post.title}
                </Link>
              </h2>
              <p className="text-gray-600 mb-4">{post.date}</p>
              <div 
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(post.content, {
                    ALLOWED_TAGS: ['p', 'strong', 'em', 'u', 's', 'a', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'img', 'pre', 'code'],
                    ALLOWED_ATTR: ['href', 'target', 'src', 'alt', 'width', 'height', 'class']
                  })
                }}
              />
              <div className="mt-4">
                <Link href={`/blog/${post.id}`} className="text-blue-500 hover:underline">
                  続きを読む →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
