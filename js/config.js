/* ============================================================
   config.js — Supabase Client
   Điền SUPABASE_URL và SUPABASE_ANON_KEY từ:
   Supabase Dashboard → Settings → API
   ============================================================ */

const SUPABASE_URL = 'https://davxzhiyegkufjgoxluv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhdnh6aGl5ZWdrdWZqZ294bHV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MTE2NTUsImV4cCI6MjA5MTM4NzY1NX0.axaEpn0yF06VIw8q1ErfK0DobAXAjybWzM-9P8XrCcQ';

// Ghi đè biến global supabase của CDN bằng Client Instance
window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
