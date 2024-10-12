import { supabase } from './supabase'

export interface Post {
  id: number;
  title: string;
  date: string;
  content: string;
}

export interface Draft extends Omit<Post, 'id'> {
  user_id: string;
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

export async function saveDraft(draft: Omit<Draft, 'date'>): Promise<Draft | null> {
  const { data, error } = await supabase
    .from('drafts')
    .upsert({ 
      ...draft, 
      date: new Date().toISOString(),
      user_id: (await supabase.auth.getUser()).data.user?.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving draft:', error)
    return null
  }

  return data
}

export async function getDraft(user_id: string): Promise<Draft | null> {
  const { data, error } = await supabase
    .from('drafts')
    .select('*')
    .eq('user_id', user_id)
    .single()

  if (error) {
    console.error('Error fetching draft:', error)
    return null
  }

  return data
}

export async function deleteDraft(user_id: string): Promise<boolean> {
  const { error } = await supabase
    .from('drafts')
    .delete()
    .eq('user_id', user_id)

  if (error) {
    console.error('Error deleting draft:', error)
    return false
  }

  return true
}

export async function getAllDrafts(user_id: string): Promise<Draft[]> {
  const { data, error } = await supabase
    .from('drafts')
    .select('*')
    .eq('user_id', user_id)
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching drafts:', error)
    return []
  }

  return data || []
}
