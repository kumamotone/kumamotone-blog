import { createClient, User } from '@supabase/supabase-js'

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

    if (data.user) {
      // ユーザーをusersテールに追加
      const { error: insertError } = await supabase
        .from('users')
        .insert({ id: data.user.id, is_admin: false })

      if (insertError) {
        console.error('Error inserting user into users table:', insertError)
      }
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

export const uploadImage = async (file: File): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = fileName;

    const { data, error } = await supabase.storage
      .from('blog-images')
      .upload(filePath, file);

    if (error) {
      console.error('Supabase storage error:', error);
      throw new Error(`画像のアップロードに失敗しました: ${error.message}`);
    }

    if (!data) {
      throw new Error('アップロードデータが見つかりません');
    }

    const { data: urlData } = supabase.storage
      .from('blog-images')
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      throw new Error('公開URLが見つかりません');
    }

    console.log('Uploaded image URL:', urlData.publicUrl); // デバッグ用

    return urlData.publicUrl;
  } catch (error) {
    console.error('画像アップロードエラー:', error);
    throw error;
  }
};
