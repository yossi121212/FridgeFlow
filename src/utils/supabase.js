'use client';

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with properly formatted URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

console.log('Supabase URL:', supabaseUrl);

// Create Supabase client with options to handle errors better
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    timeout: 30000 // 30 seconds
  },
  global: {
    fetch: (...args) => fetch(...args)
  }
}); 