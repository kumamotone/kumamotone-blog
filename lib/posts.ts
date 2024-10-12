import { supabase } from './supabase'

export interface Post {
  id: number;
  title: string;
  date: string;
  content: string;
}

export async function getAllPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching posts:', error)
    return []
  }

  console.log('Fetched posts:', data); // デバッグログを追加
  return data || []
}

export async function getPostById(id: number): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching post:', error)
    return null
  }

  return data
}

export async function createPost(post: Omit<Post, 'id' | 'date'>): Promise<Post | null> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert({ ...post, date: new Date().toISOString().split('T')[0] })
      .select()
      .single()

    if (error) {
      console.error('Error creating post:', error)
      throw error
    }

    return data
  } catch (error) {
    console.error('Error creating post:', error)
    return null
  }
}

export async function updatePost(id: number, post: Partial<Post>): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .update(post)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating post:', error)
    return null
  }

  return data
}

export async function deletePost(id: number): Promise<boolean> {
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting post:', error)
    return false
  }

  return true
}
