import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import 'prismjs/themes/prism-tomorrow.css'
import './globals.css'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '山蔭の熊小屋',
  description: '山蔭の熊小屋のブログサイトです。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <nav className="bg-gray-800 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="text-xl font-bold">山蔭の熊小屋</Link>
            <ul className="flex space-x-4">
              <li><Link href="/" className="hover:text-gray-300">ホーム</Link></li>
              <li><Link href="/blog" className="hover:text-gray-300">ブログ</Link></li>
              <li><Link href="/drafts" className="hover:text-gray-300">下書き</Link></li>
            </ul>
          </div>
        </nav>
        <main className="container mx-auto mt-8 px-4">{children}</main>
      </body>
    </html>
  )
}
