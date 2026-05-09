import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, AppRole, isProfessorRole } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export function RoleGuard({
  role,
  roles,
  children,
}: {
  role?: AppRole | "professor_any";
  roles?: AppRole[];
  children: ReactNode;
}) {
  const { user, role: userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const matches =
    (role === "professor_any" && isProfessorRole(userRole)) ||
    (role && role !== "professor_any" && userRole === role) ||
    (roles && userRole && roles.includes(userRole));

  if (!matches) {
    if (userRole === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (userRole === "assistant") return <Navigate to="/assistant/dashboard" replace />;
    return <Navigate to="/professor/dashboard" replace />;
  }
  return <>{children}</>;
}
