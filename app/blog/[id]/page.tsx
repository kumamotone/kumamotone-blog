import { getAllPosts, getPostById } from "@/lib/posts"
import { getCurrentUser } from "@/lib/supabase"
import Link from "next/link"
import { FiEdit, FiTwitter } from 'react-icons/fi'
import { renderContent } from '@/app/components/PostContent'

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((post) => ({
    id: post.id.toString(),
  }))
}

export default async function BlogPost({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const [currentUser, post] = await Promise.all([
    getCurrentUser(),
    getPostById(id)
  ]);

  if (!post) {
    return <div>記事が見つかりません。</div>;
  }

  const handleTweet = () => {
    const tweetText = encodeURIComponent(`${post.title} | 熊小屋`);
    const tweetUrl = encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_URL}/blog/${post.id}`);
    return `https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`;
  };

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
        {currentUser && (
          <Link href={`/blog/edit/${post.id}`} className="text-green-600 hover:underline flex items-center">
            <FiEdit className="mr-2" />
            編集
          </Link>
        )}
        <a
          href={handleTweet()}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600 flex items-center"
        >
          <FiTwitter className="mr-2" />
          X に投稿
        </a>
      </div>
      <div className="mt-8">
        <Link href="/" className="text-green-600 hover:underline">
          ← ホームに戻る
        </Link>
      </div>
    </div>
  );
}
