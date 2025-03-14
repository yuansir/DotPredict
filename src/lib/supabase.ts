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

console.log('Supabase配置初始化:', { 
  url: supabaseUrl ? '已设置' : '未设置', 
  key: supabaseAnonKey ? '已设置(长度:' + supabaseAnonKey.length + ')' : '未设置',
  timestamp: new Date().toISOString()
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('缺少Supabase环境变量', { timestamp: new Date().toISOString() });
  throw new Error('Missing Supabase environment variables');
}

console.log('创建Supabase客户端...', { timestamp: new Date().toISOString() });

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    debug: true, // 启用认证调试
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
});

console.log('Supabase客户端创建完成', { timestamp: new Date().toISOString() });

// 添加认证状态变化监听器用于调试
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase全局认证状态变化:', { 
    event, 
    session: session ? {
      id: session.access_token.substring(0, 10) + '...',
      user: session.user?.email,
      expires_at: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'unknown'
    } : null,
    timestamp: new Date().toISOString()
  });
  
  // 记录详细的事件类型
  if (event === 'SIGNED_IN') {
    console.log('用户已登录', { timestamp: new Date().toISOString() });
  } else if (event === 'SIGNED_OUT') {
    console.log('用户已登出', { timestamp: new Date().toISOString() });
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('令牌已刷新', { timestamp: new Date().toISOString() });
  } else if (event === 'USER_UPDATED') {
    console.log('用户信息已更新', { timestamp: new Date().toISOString() });
  } else {
    console.log(`未知认证事件: ${event}`, { timestamp: new Date().toISOString() });
  }
});

// 测试数据库连接
export const testConnection = async () => {
  try {
    console.log('测试Supabase连接...', { timestamp: new Date().toISOString() });
    console.log('URL:', supabaseUrl);
    
    const start = Date.now();
    const { data, error } = await supabase
      .from('daily_records')
      .select('date')
      .limit(1);
    
    const duration = Date.now() - start;
    console.log(`连接测试完成，耗时${duration}ms`, { timestamp: new Date().toISOString() });
    
    if (error) {
      console.error('连接测试失败:', error, { timestamp: new Date().toISOString() });
      return {
        success: false,
        error: error.message,
        duration
      };
    }
    
    console.log('连接测试成功:', data, { timestamp: new Date().toISOString() });
    return {
      success: true,
      duration,
      data
    };
  } catch (error) {
    console.error('连接测试异常:', error, { timestamp: new Date().toISOString() });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: -1
    };
  }
};
