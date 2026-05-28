import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Session, User, AuthError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Profile, UserRole } from "../types/database";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;

  // Auth actions
  signUp: (params: SignUpParams) => Promise<{ error: string | null }>;
  signIn: (params: SignInParams) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInWithPhone: (phone: string) => Promise<{ error: string | null }>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ error: string | null }>;
  resetPassword: (newPassword: string) => Promise<{ error: string | null }>;
  updateRole: (role: UserRole) => Promise<{ error: string | null }>;
  fetchProfile: () => Promise<void>;
  clearError: () => void;
  initialize: () => Promise<void>;
}

interface SignUpParams {
  email: string;
  password: string;
  name: string;
  phone: string;
}

interface SignInParams {
  email: string;
  password: string;
  rememberMe: boolean;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      session: null,
      isLoading: false,
      error: null,

      // ── Initialize: restore session on app load ───────────────────────────
      initialize: async () => {
        set({ isLoading: true });
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          set({ session, user: session.user });
          await get().fetchProfile();
        }
        // Listen for auth state changes (OAuth callbacks, token refresh, etc.)
        supabase.auth.onAuthStateChange(async (_event, session) => {
          set({ session, user: session?.user ?? null });
          if (session) await get().fetchProfile();
          else set({ profile: null });
        });
        set({ isLoading: false });
      },

      // ── Fetch profile from public.profiles ───────────────────────────────
      fetchProfile: async () => {
        const user = get().user ?? (await supabase.auth.getUser()).data.user;
        if (!user) return;
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (!error && data) set({ profile: data as Profile });
      },

      // ── Sign up ───────────────────────────────────────────────────────────
      signUp: async ({ email, password, name, phone }) => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name, phone }, // stored in auth.users.raw_user_meta_data
              emailRedirectTo: `${window.location.origin}/verify`,
            },
          });

          if (error) throw error;
          if (!data.user) throw new Error("Signup failed — no user returned");

          // Insert into public.profiles (role will be set on role-select page)
          const { error: profileError } = await supabase.from("profiles").insert({
            id: data.user.id,
            email,
            name,
            phone,
            role: "customer", // default; overwritten on /role-select
          });

          if (profileError && profileError.code !== "23505") {
            // 23505 = unique violation (profile already exists — safe to ignore)
            throw profileError;
          }

          set({ user: data.user, session: data.session });
          return { error: null };
        } catch (err) {
          const msg = (err as AuthError).message ?? "Signup failed. Please try again.";
          set({ error: msg });
          return { error: msg };
        } finally {
          set({ isLoading: false });
        }
      },

      // ── Sign in ───────────────────────────────────────────────────────────
      signIn: async ({ email, password, rememberMe }) => {
        set({ isLoading: true, error: null });
        try {
          // Supabase persists by default; for "don't remember me" we clear on tab close
          if (!rememberMe) {
            await supabase.auth.signOut(); // clear any stale session first
          }

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          set({ user: data.user, session: data.session });
          await get().fetchProfile();
          return { error: null };
        } catch (err) {
          const msg = (err as AuthError).message ?? "Sign in failed. Check your credentials.";
          set({ error: msg });
          return { error: msg };
        } finally {
          set({ isLoading: false });
        }
      },

      // ── Google OAuth ──────────────────────────────────────────────────────
      signInWithGoogle: async () => {
        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: `${window.location.origin}/auth/callback`,
              queryParams: { access_type: "offline", prompt: "consent" },
            },
          });
          if (error) throw error;
          // Browser redirects — no further action needed here
          return { error: null };
        } catch (err) {
          const msg = (err as AuthError).message ?? "Google sign-in failed.";
          set({ error: msg, isLoading: false });
          return { error: msg };
        }
      },

      // ── Phone OTP (M-Pesa number) ─────────────────────────────────────────
      signInWithPhone: async (phone: string) => {
        set({ isLoading: true, error: null });
        try {
          // Normalise to E.164 (+254...)
          const normalised = phone.startsWith("0")
            ? "+254" + phone.slice(1)
            : phone.startsWith("254")
            ? "+" + phone
            : phone;

          const { error } = await supabase.auth.signInWithOtp({
            phone: normalised,
          });
          if (error) throw error;
          return { error: null };
        } catch (err) {
          const msg = (err as AuthError).message ?? "Failed to send OTP.";
          set({ error: msg });
          return { error: msg };
        } finally {
          set({ isLoading: false });
        }
      },

      // ── Verify phone OTP ──────────────────────────────────────────────────
      verifyPhoneOtp: async (phone: string, token: string) => {
        set({ isLoading: true, error: null });
        try {
          const normalised = phone.startsWith("0")
            ? "+254" + phone.slice(1)
            : phone.startsWith("254")
            ? "+" + phone
            : phone;

          const { data, error } = await supabase.auth.verifyOtp({
            phone: normalised,
            token,
            type: "sms",
          });
          if (error) throw error;
          set({ user: data.user, session: data.session });
          await get().fetchProfile();
          return { error: null };
        } catch (err) {
          const msg = (err as AuthError).message ?? "Invalid OTP. Please try again.";
          set({ error: msg });
          return { error: msg };
        } finally {
          set({ isLoading: false });
        }
      },

      // ── Forgot password ───────────────────────────────────────────────────
      forgotPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          });
          if (error) throw error;
          return { error: null };
        } catch (err) {
          const msg = (err as AuthError).message ?? "Failed to send reset email.";
          set({ error: msg });
          return { error: msg };
        } finally {
          set({ isLoading: false });
        }
      },

      // ── Reset password (from email link) ──────────────────────────────────
      resetPassword: async (newPassword: string) => {
        set({ isLoading: true, error: null });
        try {
          const { error } = await supabase.auth.updateUser({
            password: newPassword,
          });
          if (error) throw error;
          return { error: null };
        } catch (err) {
          const msg = (err as AuthError).message ?? "Password reset failed.";
          set({ error: msg });
          return { error: msg };
        } finally {
          set({ isLoading: false });
        }
      },

      // ── Update role (called from RoleSelectPage) ──────────────────────────
      updateRole: async (role: UserRole) => {
        set({ isLoading: true, error: null });
        try {
          const user = get().user;
          if (!user) throw new Error("Not authenticated");

          const { error } = await supabase
            .from("profiles")
            .update({ role })
            .eq("id", user.id);

          if (error) throw error;
          set((state) => ({
            profile: state.profile ? { ...state.profile, role } : null,
          }));
          return { error: null };
        } catch (err) {
          const msg = (err as AuthError).message ?? "Failed to save role.";
          set({ error: msg });
          return { error: msg };
        } finally {
          set({ isLoading: false });
        }
      },

      // ── Sign out ──────────────────────────────────────────────────────────
      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, profile: null, session: null, error: null });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "majilink-auth-store",
      storage: createJSONStorage(() => localStorage),
      // Only persist non-sensitive state; Supabase manages the actual token
      partialize: (state) => ({ profile: state.profile }),
    }
  )
);
