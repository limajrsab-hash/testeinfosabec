import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck } from "lucide-react";
import { fmtRelative } from "@/lib/format";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function ProfessorNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const navigate = useNavigate();

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("notifications").select("*")
      .eq("user_id", user.id).order("created_at", { ascending: false });
    setItems(data ?? []);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase.channel("notif-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const markAll = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ read: true })
      .eq("user_id", user.id).eq("read", false);
    toast.success("Todas marcadas como lidas");
    load();
  };

  const click = async (n: any) => {
    if (!n.read) await supabase.from("notifications").update({ read: true }).eq("id", n.id);
    if (n.metadata?.request_id) navigate("/professor/solicitacoes");
    load();
  };

  return (
    <>
      <PageHeader title="Notificações" action={
        <Button variant="outline" onClick={markAll}>
          <CheckCheck className="mr-2 h-4 w-4" /> Marcar todas como lidas
        </Button>
      } />
      {items.length === 0 ? (
        <EmptyState icon={Bell} title="Sem notificações" description="Você está em dia." />
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-card">
          {items.map((n) => (
            <button key={n.id} onClick={() => click(n)}
              className="flex w-full items-start gap-3 border-b border-border p-4 text-left last:border-b-0 hover:bg-muted/30">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{n.title}</p>
                {n.body && <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>}
                <p className="mt-1 text-xs text-muted-foreground">{fmtRelative(n.created_at)}</p>
              </div>
              {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
