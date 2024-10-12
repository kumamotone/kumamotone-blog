'use client'

import { useState, useEffect } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { getPostById, deletePost, Post } from "@/lib/posts";
import { getCurrentUser } from "@/lib/supabase";

export default function BlogPost({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<Post | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();
  const id = parseInt(params.id);

  useEffect(() => {
    async function loadData() {
      const [loadedPost, currentUser] = await Promise.all([
        getPostById(id),
        getCurrentUser()
      ]);
      setPost(loadedPost);
      setUser(currentUser);
      setIsLoading(false);
    }
    loadData();
  }, [id]);

  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await deletePost(id);
    if (success) {
      router.push('/blog');
    } else {
      setIsDeleting(false);
      alert('記事の削除に失敗しました。');
    }
  };

  if (isLoading) return <div>読み込み中...</div>;
  if (!post) return <div>記事が見つかりません</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
      <p className="text-gray-500 mb-4">{post.date}</p>
      <div className="mb-8">{post.content}</div>
      <Link href="/blog" className="text-blue-500 hover:underline">
        記事一覧に戻る
      </Link>
      {user && (
        <>
          <Link href={`/blog/edit/${id}`} className="text-blue-500 hover:underline ml-4">
            編集
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 mt-4 ml-4"
            disabled={isDeleting}
          >
            {isDeleting ? '削除中...' : '記事を削除'}
          </button>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">本当に削除しますか？</h2>
            <p className="mb-4">この操作は取り消せません。</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
