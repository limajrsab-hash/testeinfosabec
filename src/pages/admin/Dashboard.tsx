import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Users, Inbox, AlertTriangle, Calendar, Loader2 } from "lucide-react";
import { fmtDate, solicitacaoStatusLabel, solicitacaoTypeLabel } from "@/lib/format";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ profs: 0, open: 0, urgent: 0, pending: 0, jobs: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [pendingItems, setPendingItems] = useState<any[]>([]);

  const load = async () => {
    const [profs, open, urgent, pend, jobs, rec, pend2] = await Promise.all([
      supabase.from("user_roles").select("user_id", { count: "exact", head: true })
        .in("role", ["professor", "professor_managed", "professor_autonomous"]),
      supabase.from("solicitacoes").select("*", { count: "exact", head: true }).eq("status", "aberta"),
      supabase.from("solicitacoes").select("*", { count: "exact", head: true })
        .eq("priority", "urgente").neq("status", "cancelada"),
      supabase.from("schedule_items").select("*", { count: "exact", head: true }).eq("status", "pendente_aprovacao"),
      supabase.from("jobs").select("*", { count: "exact", head: true }).in("status", ["pending", "processing"]),
      supabase.from("solicitacoes")
        .select("*, profiles:professor_id(name), teams(name)")
        .order("created_at", { ascending: false }).limit(10),
      supabase.from("schedule_items")
        .select("*, profiles:professor_id(name)")
        .eq("status", "pendente_aprovacao").order("proposed_date").limit(10),
    ]);
    setStats({
      profs: profs.count ?? 0, open: open.count ?? 0, urgent: urgent.count ?? 0,
      pending: pend.count ?? 0, jobs: jobs.count ?? 0,
    });
    setRecent(rec.data ?? []);
    setPendingItems(pend2.data ?? []);
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string, profId: string, date: string) => {
    await supabase.from("schedule_items").update({ status: "aprovado", approved_date: date }).eq("id", id);
    await supabase.from("notifications").insert({
      user_id: profId, type: "data_aprovada", title: "Data aprovada", body: "Sua proposta de cronograma foi aprovada.",
    });
    toast.success("Data aprovada");
    load();
  };
  const reject = async (id: string, profId: string) => {
    await supabase.from("schedule_items").update({ status: "cancelado" }).eq("id", id);
    await supabase.from("notifications").insert({
      user_id: profId, type: "data_rejeitada", title: "Proposta rejeitada", body: "Entre em contato para realinhamento.",
    });
    toast.info("Proposta rejeitada");
    load();
  };

  return (
    <>
      <PageHeader title="Dashboard" description="Visão executiva da operação." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Professores" value={stats.profs} icon={Users} />
        <StatCard label="Solicitações abertas" value={stats.open} icon={Inbox} tone="warning" />
        <StatCard label="Urgentes" value={stats.urgent} icon={AlertTriangle} tone="destructive" />
        <StatCard label="Cronograma pendente" value={stats.pending} icon={Calendar} tone="info" />
        <StatCard label="Jobs em andamento" value={stats.jobs} icon={Loader2} tone="info" />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Solicitações Recentes</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Professor</th>
                <th className="p-3 text-left">Equipe</th>
                <th className="p-3 text-left">Título</th>
                <th className="p-3 text-left">Tipo</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Data</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0
                ? <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Sem solicitações.</td></tr>
                : recent.map((r) => (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                    <td className="p-3">{r.profiles?.name ?? "—"}</td>
                    <td className="p-3 text-muted-foreground">{r.teams?.name ?? "—"}</td>
                    <td className="p-3">
                      <Link to="/admin/solicitacoes" className="font-medium text-foreground hover:text-primary">{r.title}</Link>
                      {r.priority === "urgente" && <span className="ml-2 text-xs [color:hsl(var(--destructive))]">Urgente</span>}
                    </td>
                    <td className="p-3 text-muted-foreground">{solicitacaoTypeLabel[r.type] ?? r.type}</td>
                    <td className="p-3">
                      <StatusBadge status={r.status} label={solicitacaoStatusLabel[r.status] ?? r.status} />
                    </td>
                    <td className="p-3 text-muted-foreground">{fmtDate(r.created_at)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Cronograma — Pendentes de Aprovação</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Professor</th>
                <th className="p-3 text-left">Título</th>
                <th className="p-3 text-left">Data proposta</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pendingItems.length === 0
                ? <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Nenhuma pendência.</td></tr>
                : pendingItems.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="p-3">{s.profiles?.name ?? "—"}</td>
                    <td className="p-3 font-medium">{s.title}</td>
                    <td className="p-3 text-muted-foreground">{fmtDate(s.proposed_date)}</td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="outline" className="mr-2" onClick={() => reject(s.id, s.professor_id)}>Rejeitar</Button>
                      <Button size="sm" onClick={() => approve(s.id, s.professor_id, s.proposed_date)}>Aprovar</Button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
