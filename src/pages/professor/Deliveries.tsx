import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Package, ExternalLink } from "lucide-react";
import { fmtDate, deliveryStatusLabel } from "@/lib/format";

export default function ProfessorDeliveries() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("deliveries").select("*")
      .eq("professor_id", user.id).order("created_at", { ascending: false });
    setItems(data ?? []);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase.channel("del-prof")
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries", filter: `professor_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  return (
    <>
      <PageHeader title="Minhas Entregas" description="Acompanhe o andamento das suas entregas em tempo real." />
      {items.length === 0 ? (
        <EmptyState icon={Package} title="Nenhuma entrega ainda"
          description="Suas entregas aparecerão aqui quando forem iniciadas." />
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-card">
          {items.map((d) => (
            <div key={d.id} className="flex items-center justify-between border-b border-border p-4 last:border-b-0">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{d.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {d.due_date ? `Prazo: ${fmtDate(d.due_date)}` : `Criada em ${fmtDate(d.created_at)}`}
                  {d.delivery_date && ` · Entregue em ${fmtDate(d.delivery_date)}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {d.link_entrega && (
                  <a href={d.link_entrega} target="_blank" rel="noopener noreferrer"
                     className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                    <ExternalLink className="h-4 w-4" /> Abrir
                  </a>
                )}
                <StatusBadge status={d.status} label={deliveryStatusLabel[d.status]} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
