import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fmtDate, scheduleStatusLabel } from "@/lib/format";
import { toast } from "sonner";

export default function AdminSchedules() {
  const [items, setItems] = useState<any[]>([]);
  const [groupBy, setGroupBy] = useState<"professor" | "team">("professor");
  const [filterStatus, setFilterStatus] = useState("all");

  const load = async () => {
    const { data } = await supabase.from("schedule_items")
      .select("*, profiles:professor_id(name), teams(name)").order("proposed_date");
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const updateItem = async (id: string, profId: string, patch: any, notifyTitle?: string) => {
    await supabase.from("schedule_items").update(patch).eq("id", id);
    if (notifyTitle) {
      await supabase.from("notifications").insert({
        user_id: profId, type: "cronograma_atualizado", title: notifyTitle,
      });
    }
    toast.success("Atualizado"); load();
  };

  const filtered = items.filter((i) => filterStatus === "all" || i.status === filterStatus);
  const groups: Record<string, any[]> = {};
  for (const i of filtered) {
    const key = groupBy === "professor" ? (i.profiles?.name ?? "Sem professor") : (i.teams?.name ?? "Sem equipe");
    (groups[key] ||= []).push(i);
  }

  return (
    <>
      <PageHeader title="Cronogramas" description="Aprove, reagende e acompanhe entregas." />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs value={groupBy} onValueChange={(v: any) => setGroupBy(v)}>
          <TabsList>
            <TabsTrigger value="professor">Por professor</TabsTrigger>
            <TabsTrigger value="team">Por equipe</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(scheduleStatusLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {Object.keys(groups).length === 0 ? (
        <p className="text-sm text-muted-foreground">Sem itens.</p>
      ) : Object.entries(groups).map(([k, list]) => (
        <section key={k} className="mb-6">
          <h3 className="mb-2 text-sm font-semibold uppercase text-muted-foreground">{k}</h3>
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            {list.map((s) => (
              <ScheduleRow key={s.id} item={s} onUpdate={updateItem} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

function ScheduleRow({ item, onUpdate }: { item: any; onUpdate: any }) {
  const [newDate, setNewDate] = useState(item.proposed_date);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 last:border-b-0">
      <div className="min-w-0">
        <p className="font-medium">{item.title}</p>
        <p className="text-xs text-muted-foreground">
          Proposta: {fmtDate(item.proposed_date)}{item.approved_date && ` · Aprovada: ${fmtDate(item.approved_date)}`}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={item.status} label={scheduleStatusLabel[item.status]} />
        {item.status === "pendente_aprovacao" && (
          <>
            <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="w-40" />
            <Button size="sm" onClick={() => onUpdate(item.id, item.professor_id, { status: "aprovado", approved_date: newDate }, "Data aprovada")}>Aprovar</Button>
          </>
        )}
        {item.status === "aprovado" && (
          <>
            <Button size="sm" variant="outline" onClick={() => onUpdate(item.id, item.professor_id, { status: "entregue" }, "Marcada como entregue")}>Entregue</Button>
            <Button size="sm" variant="outline" onClick={() => onUpdate(item.id, item.professor_id, { status: "atrasado" }, "Marcada como atrasada")}>Atrasada</Button>
          </>
        )}
        {item.status !== "cancelado" && (
          <Button size="sm" variant="ghost" onClick={() => onUpdate(item.id, item.professor_id, { status: "cancelado" }, "Item cancelado")}>Cancelar</Button>
        )}
      </div>
    </div>
  );
}
