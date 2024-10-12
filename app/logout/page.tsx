'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/supabase'

export default function Logout() {
  const router = useRouter()

  useEffect(() => {
    async function handleLogout() {
      await signOut()
      router.push('/')
    }
    handleLogout()
  }, [router])

  return <div>ログアウト中...</div>
}
