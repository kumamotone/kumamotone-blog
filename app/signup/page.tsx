'use client'

import Link from 'next/link'

export default function Signup() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">新規登録</h1>
      <p className="mb-4">申し訳ありませんが、現在新規登録は一時的に停止しています。</p>
      {/* 
      新規登録フォームはコメントアウトされています
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
          登録する
        </button>
      </form>
      */}
      <p className="mt-4">
        アカウントをお持ちの方は<Link href="/login" className="text-blue-500 hover:underline">こちらからログイン</Link>してください。
      </p>
    </div>
  )
}
