import { createClient } from '@supabase/supabase-js'

// Inserisci i tuoi dati tra gli apici
const supabaseUrl = 'https://wsulatrptrhwuzmoyfre.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzdWxhdHJwdHJod3V6bW95ZnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMTA3MTYsImV4cCI6MjA5MzU4NjcxNn0.q3Ko51o9YAXSOVApsbHd7MhvhOvaJJ6yqo1-NpDIpR8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const WORLD_CUP_START_DATE = new Date('2026-06-11T21:00:00Z');