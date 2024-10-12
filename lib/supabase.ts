import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// メールアドレスとパスワードで認証を行う関数
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Error signing in:', error)
  }
  return { user: data.user, error }
}

// 新規登録用の関数を修正
export async function signUpWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      if (error.status === 429) {
        throw new Error('リクエストが多すぎます。しばらく待ってから再試行してください。')
      }
      throw error
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error signing up:', error)
    return { data: null, error }
  }
}

// サインアウトする関数
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error)
  }
}

// 現在のユーザーを取得する関数
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Error getting current user:', error)
    return null
  }
  return data.session?.user || null
}
