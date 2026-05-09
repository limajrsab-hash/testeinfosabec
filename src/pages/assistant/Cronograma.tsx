import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Calendar } from "lucide-react";
import { fmtDate, scheduleStatusLabel, deliveryStatusLabel } from "@/lib/format";

export default function AssistantCronograma() {
  const { user } = useAuth();
  const [mine, setMine] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("schedule_items").select("*").eq("professor_id", user.id)
      .order("proposed_date").then(({ data }) => setMine(data ?? []));
    supabase.from("deliveries").select("*, prof:professor_id(name), teams(name)")
      .order("due_date", { ascending: true })
      .then(({ data }) => setDeliveries(data ?? []));
  }, [user]);

  return (
    <>
      <PageHeader title="Cronograma" description="Seus itens e entregas da equipe." />

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">Meus itens</h2>
        {mine.length === 0 ? (
          <EmptyState icon={Calendar} title="Nenhum item" description="Você ainda não tem itens de cronograma." />
        ) : (
          <div className="rounded-xl border border-border bg-card shadow-card">
            {mine.map((s) => (
              <div key={s.id} className="flex items-center justify-between border-b border-border p-4 last:border-b-0">
                <div><p className="font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{fmtDate(s.proposed_date)}</p></div>
                <StatusBadge status={s.status} label={scheduleStatusLabel[s.status]} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">Entregas da equipe</h2>
        {deliveries.length === 0 ? (
          <EmptyState icon={Calendar} title="Sem entregas" description="Nenhuma entrega visível." />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr><th className="p-3 text-left">Professor</th><th className="p-3 text-left">Equipe</th><th className="p-3 text-left">Título</th><th className="p-3 text-left">Prazo</th><th className="p-3 text-left">Status</th></tr>
              </thead>
              <tbody>
                {deliveries.map((d) => (
                  <tr key={d.id} className="border-t border-border">
                    <td className="p-3">{d.prof?.name ?? "—"}</td>
                    <td className="p-3 text-muted-foreground">{d.teams?.name ?? "—"}</td>
                    <td className="p-3 font-medium">{d.title}</td>
                    <td className="p-3 text-muted-foreground">{fmtDate(d.due_date)}</td>
                    <td className="p-3"><StatusBadge status={d.status} label={deliveryStatusLabel[d.status]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
