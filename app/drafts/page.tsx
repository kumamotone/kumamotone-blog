'use client'

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { getAllDrafts, Draft, deleteDraft } from "@/lib/posts";
import { getCurrentUser } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export default function DraftsList() {
  const [user, setUser] = useState<User | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
        if (currentUser) {
          const userDrafts = await getAllDrafts(currentUser.id);
          setDrafts(userDrafts);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const handleDeleteDraft = async (user_id: string) => {
    const success = await deleteDraft(user_id);
    if (success) {
      setDrafts(drafts.filter(draft => draft.user_id !== user_id));
    } else {
      alert('下書きの削除に失敗しました。');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-center">下書き一覧</h1>
      {drafts.length === 0 ? (
        <p className="text-center text-gray-500">下書きがありません。</p>
      ) : (
        <ul className="space-y-6">
          {drafts.map((draft) => (
            <li key={draft.user_id} className="border-b pb-4">
              <Link href={`/blog/new?draft=${draft.user_id}`} className="text-xl font-semibold text-blue-600 hover:underline">
                {draft.title}
              </Link>
              <p className="text-gray-500 text-sm mt-1">{new Date(draft.created_at).toLocaleString()}</p>
              <button
                onClick={() => handleDeleteDraft(draft.user_id)}
                className="text-sm text-red-500 hover:underline mt-2 inline-block mr-4"
              >
                削除
              </button>
              <Link href={`/blog/new?draft=${draft.user_id}`} className="text-sm text-blue-500 hover:underline mt-2 inline-block">
                編集
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link href="/blog" className="text-blue-500 hover:underline mt-8 inline-block">
        ブログ一覧に戻る
      </Link>
    </div>
  );
}
