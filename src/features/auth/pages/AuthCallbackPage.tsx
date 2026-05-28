import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Droplets } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/useAuthStore";

/**
 * AuthCallbackPage — handles the redirect after:
 *  - Google OAuth sign-in
 *  - Email verification link
 *  - Magic link login
 *
 * Supabase's detectSessionInUrl:true picks up the token from the URL hash/
 * query params automatically. We just wait for the session, create the
 * profile if it's a new OAuth user, then redirect.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { fetchProfile } = useAuthStore();

  useEffect(() => {
    async function handleCallback() {
      // getSession will pick up the tokens Supabase set from the URL
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        navigate("/?error=auth_callback_failed");
        return;
      }

      const user = session.user;

      // For Google OAuth users: upsert profile if it doesn't exist yet
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .single();

      if (!existingProfile) {
        // New Google user — create their profile
        const name =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "User";

        await supabase.from("profiles").insert({
          id: user.id,
          email: user.email!,
          name,
          phone: user.phone ?? "",
          role: "customer",
        });

        // Send them to role selector
        await fetchProfile();
        navigate("/role-select");
        return;
      }

      await fetchProfile();

      // Redirect based on existing role
      const role = existingProfile.role;
      if (!role || role === "customer") navigate("/customer");
      else if (role === "vendor") navigate("/vendor");
      else if (role === "driver") navigate("/driver");
      else navigate("/role-select");
    }

    handleCallback();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 rounded-2xl bg-[#134E4A] flex items-center justify-center">
        <Droplets className="w-6 h-6 text-[#4FD1C5]" />
      </div>
      <Loader2 className="w-6 h-6 text-[#134E4A] animate-spin" />
      <p className="text-sm text-gray-500">Signing you in…</p>
    </div>
  );
}
