export type UserRole = 'teacher' | 'admin' | 'parent' | 'superadmin' | null;

export interface User {
  id: number;
  name: string;
  role: UserRole;
  mosque_id?: number;
  mosque_name?: string;
  email?: string;
}

export interface Mosque {
  id: number;
  name: string;
  slug: string;
  address?: string;
}

export interface StudyGroup {
  id: number;
  mosque_id: number;
  teacher_id: number | null;
  name: string;
  teacher_name?: string; // Optional, sometimes joined
}

export interface Santri {
  id: number;
  mosque_id: number;
  group_id: number | null;
  name: string;
  slug: string;
  parent_name: string | null;
  parent_phone: string | null;
  birth_date: string | null;
  gender: string | null;
  address: string | null;
  current_level: string | null;
  mosque_name?: string;
  group_name?: string | null;
}

export interface Post {
  id: number;
  author: string;
  author_id: number;
  title: string;
  content: string;
  timestamp: string;
  avatar: string;
  created_at?: string; // Raw date string
  activity_date?: string;
  comment_count?: number;
  images?: string[];
  mosque_id?: number;
}

export interface Comment {
  id: number;
  post_id: number;
  user_name?: string;
  parent_name?: string;
  content: string;
  created_at: string;
}
