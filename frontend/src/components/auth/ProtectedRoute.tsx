import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import type { UserRole } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole[];
}

export const ProtectedRoute = ({
  children,
  requiredRole,
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        toast.error("Musisz być zalogowany!");
        navigate("/login");
        return;
      }

      if (requiredRole && !requiredRole.includes(user.role)) {
        toast.error("Brak uprawnień do tej strony!");
        navigate("/");
      }
    }
  }, [user, loading, navigate, requiredRole]);

  if (loading) return null;

  return user ? <>{children}</> : null;
};
