'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmail } from '@/lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const { user, error: signInError } = await signInWithEmail(email, password)
    if (signInError) {
      setError('ログインに失敗しました。' + signInError.message)
    } else if (user) {
      console.log('Login successful, reloading page');
      window.location.href = '/'; // ホームページにリダイレクトし、ページをリロード
    } else {
      setError('ログインに失敗しました。')
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">ログイン</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block mb-2">メールアドレス</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className="block mb-2">パスワード</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          ログイン
        </button>
      </form>
      {/* 新規登録へのリンクを削除または以下のようにコメントアウト
      <p className="mt-4">
        アカウントをお持ちでない方は<Link href="/signup" className="text-blue-500 hover:underline">こちらから新規登録</Link>してください。
      </p>
      */}
    </div>
  )
}
