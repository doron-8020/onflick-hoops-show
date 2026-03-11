import { createClient } from "@supabase/supabase-js";

// Admin panel Supabase project (read-only config data)
const ADMIN_PANEL_URL = "https://mvfaswdezodqgpfxgxqf.supabase.co";
const ADMIN_PANEL_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12ZmFzd2Rlem9kcWdwZnhneHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODczMjMsImV4cCI6MjA4ODc2MzMyM30.8AAJtZv8a0PBSoqq20R_iViA-I2IN8U7MFRRs2v8Aiw";

export const adminPanel = createClient(ADMIN_PANEL_URL, ADMIN_PANEL_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
