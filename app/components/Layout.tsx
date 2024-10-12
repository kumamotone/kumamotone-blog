import { getCurrentUser } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'
import React from 'react'

type LayoutProps = {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [user, setUser] = React.useState<User | null>(null)

  React.useEffect(() => {
    async function loadUser() {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    }
    loadUser()
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {children}
      </main>
      <footer className="bg-gray-800 text-white py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <p>&copy; 2024 熊小屋</p>
          <div>
            {user ? (
              <>
                <Link href="/drafts" className="mr-4 hover:underline">下書き一覧</Link>
                <Link href="/logout" className="hover:underline">ログアウト</Link>
              </>
            ) : (
              <Link href="/login" className="hover:underline">ログイン</Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
