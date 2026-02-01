import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bsbxkrrmbppbebybjwyq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzYnhrcnJtYnBwYmVieWJqd3lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3ODAwMzUsImV4cCI6MjA4NTM1NjAzNX0.hg3u3WWWkxhCIbfNS4GZZH9i6Fir4U3aTYTtuoBuKk8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
