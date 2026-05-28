import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Droplets } from "lucide-react";
import { useAuthStore } from "../../../store/useAuthStore";
import type { UserRole } from "../../../types/database";

interface Props {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

/**
 * Wrap any dashboard route with <ProtectedRoute> to:
 *  1. Redirect unauthenticated users to /
 *  2. Redirect authenticated users to the wrong dashboard
 *     (e.g. a customer trying to visit /vendor)
 */
export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const navigate = useNavigate();
  const { user, profile, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!user) { navigate("/"); return; }
    if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
      const dest =
        profile.role === "vendor" ? "/vendor"
        : profile.role === "driver" ? "/driver"
        : "/customer";
      navigate(dest);
    }
  }, [user, profile, isLoading]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#134E4A] flex items-center justify-center">
          <Droplets className="w-6 h-6 text-[#4FD1C5]" />
        </div>
        <Loader2 className="w-5 h-5 text-[#134E4A] animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
