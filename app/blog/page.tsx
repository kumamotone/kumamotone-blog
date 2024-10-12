import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export default function BlogList() {
  const blogPosts = getAllPosts();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">ブログ記事一覧</h1>
      <ul>
        {blogPosts.map((post) => (
          <li key={post.id} className="mb-4">
            <Link href={`/blog/${post.id}`} className="text-blue-500 hover:underline">
              <h2 className="text-xl font-semibold">{post.title}</h2>
            </Link>
            <p className="text-gray-500">{post.date}</p>
          </li>
        ))}
      </ul>
      <Link href="/" className="text-blue-500 hover:underline">
        ホームに戻る
      </Link>
    </div>
  );
}
