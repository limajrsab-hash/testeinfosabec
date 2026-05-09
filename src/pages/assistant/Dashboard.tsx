import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { ListTodo, Package, CheckCircle2, Clock } from "lucide-react";

export default function AssistantDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ triagem: 0, abertas: 0, entregues: 0, pendentes: 0 });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ count: triagem }, { count: abertas }, { count: entregues }, { count: pendentes }] = await Promise.all([
        supabase.from("triage_items").select("*", { count: "exact", head: true }).eq("status", "pendente"),
        supabase.from("deliveries").select("*", { count: "exact", head: true }).in("status", ["pendente", "em_producao", "em_revisao"]),
        supabase.from("deliveries").select("*", { count: "exact", head: true }).eq("status", "entregue"),
        supabase.from("solicitacoes").select("*", { count: "exact", head: true }).eq("status", "em_triagem"),
      ]);
      setStats({
        triagem: triagem ?? 0,
        abertas: abertas ?? 0,
        entregues: entregues ?? 0,
        pendentes: pendentes ?? 0,
      });
    })();
  }, [user]);

  return (
    <>
      <PageHeader title="Dashboard do Assistente" description="Visão geral das suas equipes." />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Triagem pendente" value={stats.triagem} icon={ListTodo} />
        <StatCard label="Solicitações em triagem" value={stats.pendentes} icon={Clock} />
        <StatCard label="Entregas em andamento" value={stats.abertas} icon={Package} />
        <StatCard label="Entregues" value={stats.entregues} icon={CheckCircle2} />
      </div>
    </>
  );
}
