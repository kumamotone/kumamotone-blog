import fs from 'fs';
import path from 'path';

const postsDirectory = path.join(process.cwd(), 'data');

export interface Post {
  id: number;
  title: string;
  date: string;
  content: string;
}

export function getAllPosts(): Post[] {
  const filePath = path.join(postsDirectory, 'posts.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContents);
}

export function getPostById(id: number): Post | undefined {
  const posts = getAllPosts();
  return posts.find(post => post.id === id);
}
