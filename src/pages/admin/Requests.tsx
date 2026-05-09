import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { fmtDate, solicitacaoStatusLabel, solicitacaoTypeLabel } from "@/lib/format";
import { toast } from "sonner";

const STATUSES = [
  { value: "aberta", label: "Aberta" },
  { value: "em_triagem", label: "Em triagem" },
  { value: "aprovada", label: "Aprovada" },
  { value: "convertida", label: "Convertida em entrega" },
  { value: "rejeitada", label: "Rejeitada" },
  { value: "cancelada", label: "Cancelada" },
];

export default function AdminRequests() {
  const [items, setItems] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [filters, setFilters] = useState({ team: "all", status: "all", type: "all", priority: "all" });
  const [detailId, setDetailId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("");

  const load = async () => {
    const { data } = await supabase.from("solicitacoes")
      .select("*, profiles:professor_id(name,email), teams(name)")
      .order("created_at", { ascending: false });
    setItems(data ?? []);
  };

  useEffect(() => {
    load();
    supabase.from("teams").select("id,name").then(({ data }) => setTeams(data ?? []));

    // Realtime — professor vê status mudar em tempo real
    const ch = supabase.channel("sol-admin-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "solicitacoes" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const detail = items.find((i) => i.id === detailId);
  useEffect(() => {
    if (detail) { setNotes(""); setStatus(detail.status); }
  }, [detailId]);

  const save = async () => {
    if (!detail) return;
    const { error } = await supabase.from("solicitacoes")
      .update({ status: status as any })
      .eq("id", detail.id);
    if (error) return toast.error(error.message);
    if (status !== detail.status) {
      await supabase.from("notifications").insert({
        user_id: detail.professor_id,
        type: "status_atualizado",
        title: "Status da solicitação atualizado",
        body: `${detail.title}: ${solicitacaoStatusLabel[status]}${notes ? ` — ${notes}` : ""}`,
        metadata: { solicitacao_id: detail.id },
      });
    }
    toast.success("Atualizado");
    setDetailId(null);
    load();
  };

  const filtered = items.filter((i) =>
    (filters.team === "all" || i.team_id === filters.team) &&
    (filters.status === "all" || i.status === filters.status) &&
    (filters.type === "all" || i.type === filters.type) &&
    (filters.priority === "all" || i.priority === filters.priority));

  return (
    <>
      <PageHeader title="Solicitações" description="Gestão de todas as demandas dos professores." />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select value={filters.team} onValueChange={(v) => setFilters({ ...filters, team: v })}>
          <SelectTrigger><SelectValue placeholder="Equipe" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as equipes</SelectItem>
            {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
          <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {Object.entries(solicitacaoTypeLabel)
              .filter(([k]) => !["material", "slide", "revisao"].includes(k))
              .map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.priority} onValueChange={(v) => setFilters({ ...filters, priority: v })}>
          <SelectTrigger><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas prioridades</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="urgente">Urgente</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3 text-left">Professor</th>
              <th className="p-3 text-left">Equipe</th>
              <th className="p-3 text-left">Título</th>
              <th className="p-3 text-left">Tipo</th>
              <th className="p-3 text-left">Prioridade</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Data</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">Sem resultados.</td></tr>
              : filtered.map((r) => (
                <tr key={r.id} onClick={() => setDetailId(r.id)} className="cursor-pointer border-t border-border hover:bg-muted/20">
                  <td className="p-3">{r.profiles?.name ?? r.profiles?.email ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{r.teams?.name ?? "—"}</td>
                  <td className="p-3 font-medium">
                    {r.title}
                    {r.priority === "urgente" && (
                      <span className="ml-2 text-xs font-medium [color:hsl(var(--destructive))]">Urgente</span>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">{solicitacaoTypeLabel[r.type] ?? r.type}</td>
                  <td className="p-3">{r.priority === "urgente"
                    ? <span className="font-medium [color:hsl(var(--destructive))]">Urgente</span>
                    : <span className="text-muted-foreground">Normal</span>}
                  </td>
                  <td className="p-3"><StatusBadge status={r.status} label={solicitacaoStatusLabel[r.status] ?? r.status} /></td>
                  <td className="p-3 text-muted-foreground">{fmtDate(r.created_at)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Sheet open={!!detailId} onOpenChange={(v) => !v && setDetailId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle>{detail.title}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Professor</p>
                  <p>{detail.profiles?.name} · {detail.profiles?.email}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Equipe</p>
                  <p>{detail.teams?.name ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Tipo</p>
                  <p>{solicitacaoTypeLabel[detail.type] ?? detail.type}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Prioridade</p>
                  <p className={detail.priority === "urgente" ? "font-medium [color:hsl(var(--destructive))]" : ""}>
                    {detail.priority === "urgente" ? "Urgente" : "Normal"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Descrição</p>
                  <p className="whitespace-pre-wrap text-muted-foreground">{detail.description}</p>
                </div>
                {detail.due_date && (
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Data desejada</p>
                    <p>{fmtDate(detail.due_date)}</p>
                  </div>
                )}
                <div>
                  <Label>Novo status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nota interna (opcional, enviada com a notificação ao professor)</Label>
                  <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                <Button className="w-full" onClick={save}>Salvar</Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
