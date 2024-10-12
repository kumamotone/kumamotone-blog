import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// 匿名認証を行う関数
export async function signInAnonymously() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'anonymous@example.com',
    password: 'anonymous_password',
  })

  if (error) {
    console.error('Error signing in anonymously:', error)
  }
  return data
}
