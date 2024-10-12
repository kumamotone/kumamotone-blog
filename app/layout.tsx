import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: '熊小屋',
    template: '%s | 熊小屋',
  },
  description: '熊小屋のブログサイトです。技術や日常についての記事を書いています。',
  openGraph: {
    title: '熊小屋',
    description: '熊小屋のブログサイトです。技術や日常についての記事を書いています。',
    url: 'https://your-domain.com',
    siteName: '熊小屋',
    images: [
      {
        url: 'https://your-domain.com/og-image.jpg',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '熊小屋',
    description: '熊小屋のブログサイトです。技術や日常についての記事を書いています。',
    creator: '@your_twitter_handle',
    images: ['https://your-domain.com/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
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
