import Link from "next/link";
import { getPostById } from "@/lib/posts";

export default async function BlogPost({ params }: { params: { id: string } }) {
  const post = await getPostById(parseInt(params.id));

  if (!post) {
    return <div>記事が見つかりません</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
      <p className="text-gray-500 mb-4">{post.date}</p>
      <div className="mb-8">{post.content}</div>
      <Link href="/blog" className="text-blue-500 hover:underline">
        記事一覧に戻る
      </Link>
    </div>
  );
}
