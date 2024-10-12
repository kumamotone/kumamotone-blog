import Link from "next/link";

// 仮のブログ記事データ（本来はデータベースやAPIから取得します）
const blogPosts = [
  { id: 1, title: "はじめてのブログ投稿", date: "2024-03-15", content: "これは最初のブログ投稿です。" },
  { id: 2, title: "Next.jsについて学んだこと", date: "2024-03-16", content: "Next.jsは素晴らしいフレームワークです。" },
  { id: 3, title: "TypeScriptの基本", date: "2024-03-17", content: "TypeScriptは型安全なJavaScriptです。" },
];

export default function BlogPost({ params }: { params: { id: string } }) {
  const post = blogPosts.find((p) => p.id === parseInt(params.id));

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
