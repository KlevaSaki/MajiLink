import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

const SUPABASE_URL = "https://aylsgypvrtfsmocflzix.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5bHNneXB2cnRmc21vY2Zseml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3Nzg0NzcsImV4cCI6MjA5NTM1NDQ3N30.Bvnx7C8S7crFt087M56uoeUOWDJHKL9EEE7BKPNDMfY";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storageKey: "majilink-auth",
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
