import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">ようこそ、私のブログへ！</h1>
      <p className="mb-4">ここでは、私の日々の思いや経験を共有しています。</p>
      <Link href="/blog" className="text-blue-500 hover:underline">
        ブログ記事一覧を見る
      </Link>
    </div>
  );
}
