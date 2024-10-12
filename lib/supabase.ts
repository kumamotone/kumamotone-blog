import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

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
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
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

// 管理者ユーザーかどうかを確認する関数
export async function isAdminUser(user: User | null): Promise<boolean> {
  if (!user) return false;
  
  const { data, error } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error checking admin status:', error);
    return false;
  }

  return data?.is_admin || false;
}

export async function uploadImage(file: File) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random()}.${fileExt}`
  const filePath = `${fileName}`

  const { data, error } = await supabase.storage
    .from('blog-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Error uploading image:', error)
    return null
  }

  const { data: urlData } = supabase.storage
    .from('blog-images')
    .getPublicUrl(filePath)

  return urlData.publicUrl
}
