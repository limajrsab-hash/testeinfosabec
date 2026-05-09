import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Inbox, Calendar, Loader2, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { fmtDate, solicitacaoStatusLabel, solicitacaoTypeLabel, scheduleStatusLabel } from "@/lib/format";

export default function ProfessorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ open: 0, jobs: 0, unread: 0 });
  const [nextDelivery, setNextDelivery] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [openR, jobsR, unreadR, nextR, recentR, upR] = await Promise.all([
        supabase.from("solicitacoes").select("*", { count: "exact", head: true })
          .eq("professor_id", user.id).eq("status", "aberta"),
        supabase.from("jobs").select("*", { count: "exact", head: true })
          .eq("created_by", user.id).in("status", ["pending", "processing"]),
        supabase.from("notifications").select("*", { count: "exact", head: true })
          .eq("user_id", user.id).eq("read", false),
        supabase.from("schedule_items").select("*").eq("professor_id", user.id)
          .eq("status", "aprovado").order("approved_date", { ascending: true }).limit(1).maybeSingle(),
        supabase.from("solicitacoes").select("*").eq("professor_id", user.id)
          .order("created_at", { ascending: false }).limit(5),
        supabase.from("schedule_items").select("*").eq("professor_id", user.id)
          .in("status", ["pendente_aprovacao", "aprovado"])
          .order("proposed_date", { ascending: true }).limit(3),
      ]);
      setStats({ open: openR.count ?? 0, jobs: jobsR.count ?? 0, unread: unreadR.count ?? 0 });
      setNextDelivery(nextR.data);
      setRecent(recentR.data ?? []);
      setUpcoming(upR.data ?? []);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <>
      <PageHeader title="Início" description="Visão geral das suas demandas e prazos." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Solicitações abertas" value={stats.open} icon={Inbox} tone="warning" />
        <StatCard label="Próxima entrega" value={nextDelivery ? fmtDate(nextDelivery.approved_date) : "—"}
          icon={Calendar} hint={nextDelivery?.title} tone="info" />
        <StatCard label="Jobs em andamento" value={stats.jobs} icon={Loader2} tone="info" />
        <StatCard label="Notificações" value={stats.unread} icon={Bell} tone="default" hint="não lidas" />
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Últimas solicitações</h2>
          <Link to="/professor/solicitacoes" className="text-sm font-medium text-primary hover:underline">Ver todas</Link>
        </div>
        <div className="rounded-xl border border-border bg-card shadow-card">
          {recent.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma solicitação ainda.</div>
          ) : recent.map((r) => (
            <Link key={r.id} to="/professor/solicitacoes" className="flex items-center justify-between border-b border-border p-4 last:border-b-0 hover:bg-muted/30">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{r.title}</p>
                <p className="text-xs text-muted-foreground">{solicitacaoTypeLabel[r.type]} · {fmtDate(r.created_at)}</p>
              </div>
              <StatusBadge status={r.status} label={solicitacaoStatusLabel[r.status]} />
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Próximas entregas</h2>
          <Link to="/professor/cronograma" className="text-sm font-medium text-primary hover:underline">Ver cronograma</Link>
        </div>
        <div className="rounded-xl border border-border bg-card shadow-card">
          {upcoming.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Nenhum item agendado.</div>
          ) : upcoming.map((s) => (
            <div key={s.id} className="flex items-center justify-between border-b border-border p-4 last:border-b-0">
              <div>
                <p className="font-medium text-foreground">{s.title}</p>
                <p className="text-xs text-muted-foreground">{fmtDate(s.approved_date ?? s.proposed_date)}</p>
              </div>
              <StatusBadge status={s.status} label={scheduleStatusLabel[s.status]} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
