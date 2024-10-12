import { supabase } from './supabase'

export interface Post {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

export interface Draft extends Omit<Post, 'id'> {
  user_id: string;
}

export async function getAllPosts(): Promise<Post[]> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`投稿の取得中にエラーが発生しました: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('getAllPosts エラー:', error);
    throw error; // エラーを上位に伝播させる
  }
}

export async function getPostById(id: number): Promise<Post | null> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`ID ${id} の投稿の取得中にエラーが発生しました: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('getPostById エラー:', error);
    throw error; // エラーを上位に伝播させる
  }
}

export async function createPost(post: Omit<Post, 'id' | 'created_at'>): Promise<Post> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert({ 
        ...post, 
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`投稿の作成中にエラーが発生しました: ${error.message}`);
    }

    if (!data) {
      throw new Error('投稿の作成に成功しましたが、データが返されませんでした。');
    }

    return data;
  } catch (error) {
    console.error('createPost エラー:', error);
    throw error; // エラーを上位に伝播させる
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

export async function saveDraft(draft: Draft): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('drafts')
      .upsert(draft, { onConflict: 'user_id' });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving draft:', error);
    return false;
  }
}

export async function getDraft(user_id: string): Promise<Draft[]> {
  const { data, error } = await supabase
    .from('drafts')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching drafts:', error);
    return [];
  }

  return data || [];
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

export async function getAllDrafts(userId: string): Promise<Draft[]> {
  const { data, error } = await supabase
    .from('drafts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching drafts:', error);
    return [];
  }

  return data || [];
}

export async function getPaginatedPosts(page: number, perPage: number = 5): Promise<{ posts: Post[], total: number }> {
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, error, count } = await supabase
    .from('posts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false }) // dateの代わりにcreated_atを使用
    .range(from, to);

  if (error) {
    console.error('Error fetching posts:', error);
    return { posts: [], total: 0 };
  }

  return { posts: data || [], total: count || 0 };
}

export async function getPreviousAndNextPost(currentId: number): Promise<{ prev: Post | null, next: Post | null }> {
  const { data, error } = await supabase
    .from('posts')
    .select('id, title, content, created_at')  // content と created_at を追加
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching posts:', error);
    return { prev: null, next: null };
  }

  const currentIndex = data.findIndex(post => post.id === currentId);
  const prev = currentIndex < data.length - 1 ? data[currentIndex + 1] : null;
  const next = currentIndex > 0 ? data[currentIndex - 1] : null;

  return { prev, next };
}
