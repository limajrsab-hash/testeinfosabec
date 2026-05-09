import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, isProfessorRole } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export default function Index() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/auth", { replace: true });
    else if (role === "admin") navigate("/admin/dashboard", { replace: true });
    else if (role === "assistant") navigate("/assistant/dashboard", { replace: true });
    else if (isProfessorRole(role)) navigate("/professor/dashboard", { replace: true });
  }, [user, role, loading, navigate]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}
