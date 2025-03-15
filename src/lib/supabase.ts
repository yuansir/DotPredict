import { createClient } from '@supabase/supabase-js';

// Type declaration for Vite's import.meta.env
declare global {
  interface ImportMeta {
    env: {
      VITE_SUPABASE_URL: string;
      VITE_SUPABASE_ANON_KEY: string;
      [key: string]: string;
    };
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// 创建Supabase客户端
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

// 测试数据库连接
export const testConnection = async () => {
  const startTime = Date.now();
  try {
    const { error } = await supabase.from('app_users').select('count()', { count: 'exact', head: true });
    
    if (error) {
      return { success: false, error: error.message, duration: Date.now() - startTime };
    }
    
    return { success: true, duration: Date.now() - startTime };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime 
    };
  }
};
