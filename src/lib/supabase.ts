import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface CounterRecord {
  id: number
  count: number
  updated_at: string
}

export interface ClickEvent {
  id: number
  x: number
  y: number
  created_at: string
}

export interface UserClick {
  id: number
  browser_fingerprint: string
  clicked_at: string
  ip_address?: string
  user_agent?: string
}
