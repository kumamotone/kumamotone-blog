import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

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
        <main className="container mx-auto mt-8 px-4">{children}</main>
      </body>
    </html>
  )
}
