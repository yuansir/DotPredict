import { createClient } from '@supabase/supabase-js';

// @ts-ignore
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// @ts-ignore
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
});

// 测试数据库连接
export const testConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    
    const start = Date.now();
    const { data, error } = await supabase
      .from('daily_records')
      .select('date')
      .limit(1);
    
    const duration = Date.now() - start;
    console.log(`Connection test completed in ${duration}ms`);
    
    if (error) {
      console.error('Connection test failed:', error);
      return {
        success: false,
        error: error.message,
        duration
      };
    }
    
    return {
      success: true,
      duration,
      data
    };
  } catch (error) {
    console.error('Connection test failed with exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: -1
    };
  }
};
