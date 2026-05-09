import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "admin"
  | "assistant"
  | "professor"
  | "professor_managed"
  | "professor_autonomous";

export const isProfessorRole = (r: AppRole | null) =>
  r === "professor" || r === "professor_managed" || r === "professor_autonomous";

const ROLE_PRIORITY: AppRole[] = [
  "admin",
  "assistant",
  "professor_managed",
  "professor_autonomous",
  "professor",
];

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) setTimeout(() => fetchRole(sess.user.id), 0);
      else setRole(null);
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) fetchRole(sess.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function fetchRole(uid: string) {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    if (data && data.length) {
      const roles = data.map((r) => r.role as AppRole);
      const top = ROLE_PRIORITY.find((r) => roles.includes(r)) ?? "professor_autonomous";
      setRole(top);
    } else {
      setRole("professor_autonomous");
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
