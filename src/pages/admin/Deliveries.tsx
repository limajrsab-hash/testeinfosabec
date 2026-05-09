import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Package, Plus } from "lucide-react";
import { fmtDate, deliveryStatusLabel, stepStatusLabel } from "@/lib/format";
import { toast } from "sonner";

const STATUSES = ["pendente", "em_producao", "em_revisao", "entregue", "cancelada"];

export default function AdminDeliveries({ teamFilterIsLegislacao = false }: { teamFilterIsLegislacao?: boolean }) {
  const [items, setItems] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [profs, setProfs] = useState<any[]>([]);
  const [filters, setFilters] = useState({ team: "all", professor: "all", status: "all", from: "", to: "" });
  const [openId, setOpenId] = useState<string | null>(null);
  const [openNew, setOpenNew] = useState(false);
  const [steps, setSteps] = useState<any[]>([]);
  const empty = { professor_id: "", team_id: "", title: "", concurso: "", qtde_aulas: "", due_date: "" };
  const [form, setForm] = useState<any>(empty);

  const load = async () => {
    let q = supabase.from("deliveries")
      .select("*, prof:professor_id(name,email), teams(name,is_legislacao)")
      .order("created_at", { ascending: false });
    const { data } = await q;
    let arr = data ?? [];
    if (teamFilterIsLegislacao) arr = arr.filter((d: any) => d.teams?.is_legislacao);
    setItems(arr);
  };

  useEffect(() => {
    load();
    supabase.from("teams").select("id,name,is_legislacao").then(({ data }) => setTeams(data ?? []));
    supabase.from("user_roles").select("user_id, profiles:user_id(id,name,email)")
      .in("role", ["professor", "professor_managed", "professor_autonomous"])
      .then(({ data }) => setProfs((data ?? []).map((d: any) => d.profiles).filter(Boolean)));
    const ch = supabase.channel("del-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [teamFilterIsLegislacao]);

  const detail = items.find((i) => i.id === openId);
  useEffect(() => {
    if (!openId) return;
    supabase.from("delivery_steps").select("*").eq("delivery_id", openId).order("order_index")
      .then(({ data }) => setSteps(data ?? []));
  }, [openId]);

  const updateStatus = async (id: string, st: string) => {
    await supabase.from("deliveries").update({ status: st as any }).eq("id", id);
    toast.success("Status atualizado"); load();
  };
  const updateLink = async (link: string) => {
    if (!openId) return;
    await supabase.from("deliveries").update({ link_entrega: link }).eq("id", openId);
    toast.success("Link salvo"); load();
  };
  const updateStep = async (id: string, st: string) => {
    await supabase.from("delivery_steps").update({ status: st as any, completed_at: st === "concluida" ? new Date().toISOString() : null }).eq("id", id);
    if (openId) {
      const { data } = await supabase.from("delivery_steps").select("*").eq("delivery_id", openId).order("order_index");
      setSteps(data ?? []);
    }
  };

  const create = async () => {
    if (!form.professor_id || !form.title) return toast.error("Professor e título são obrigatórios");
    const { data, error } = await supabase.from("deliveries").insert({
      professor_id: form.professor_id, team_id: form.team_id || null,
      title: form.title, concurso: form.concurso || null,
      qtde_aulas: form.qtde_aulas ? parseInt(form.qtde_aulas) : null,
      due_date: form.due_date || null, status: "pendente",
    }).select().single();
    if (error) return toast.error(error.message);
    if (data) {
      await supabase.from("delivery_steps").insert([
        { delivery_id: data.id, type: "producao", title: "Produção", order_index: 1 },
        { delivery_id: data.id, type: "revisao", title: "Revisão", order_index: 2 },
        { delivery_id: data.id, type: "entrega", title: "Entrega", order_index: 3 },
      ]);
    }
    toast.success("Demanda criada");
    setOpenNew(false); setForm(empty); load();
  };

  const filtered = items.filter((d) =>
    (filters.team === "all" || d.team_id === filters.team) &&
    (filters.professor === "all" || d.professor_id === filters.professor) &&
    (filters.status === "all" || d.status === filters.status) &&
    (!filters.from || (d.due_date && d.due_date >= filters.from)) &&
    (!filters.to || (d.due_date && d.due_date <= filters.to)));

  return (
    <>
      <PageHeader title={teamFilterIsLegislacao ? "Entregas Legislação" : "Entregas"} action={
        <Button onClick={() => { setForm(empty); setOpenNew(true); }}><Plus className="mr-2 h-4 w-4" /> Nova Demanda</Button>
      } />

      {!teamFilterIsLegislacao && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Select value={filters.team} onValueChange={(v) => setFilters({ ...filters, team: v })}>
            <SelectTrigger><SelectValue placeholder="Equipe" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todas equipes</SelectItem>{teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filters.professor} onValueChange={(v) => setFilters({ ...filters, professor: v })}>
            <SelectTrigger><SelectValue placeholder="Professor" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todos</SelectItem>{profs.map((p) => <SelectItem key={p.id} value={p.id}>{p.name ?? p.email}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todos status</SelectItem>{STATUSES.map((s) => <SelectItem key={s} value={s}>{deliveryStatusLabel[s]}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          <Input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={Package} title="Sem entregas" description="Crie a primeira demanda." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr><th className="p-3 text-left">Professor</th><th className="p-3 text-left">Equipe</th><th className="p-3 text-left">Título</th><th className="p-3 text-left">Concurso</th><th className="p-3 text-left">Aulas</th><th className="p-3 text-left">Prazo</th><th className="p-3 text-left">Entrega</th><th className="p-3 text-left">Status</th></tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} onClick={() => setOpenId(d.id)} className="cursor-pointer border-t border-border hover:bg-muted/20">
                  <td className="p-3">{d.prof?.name ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{d.teams?.name ?? "—"}</td>
                  <td className="p-3 font-medium">{d.title}</td>
                  <td className="p-3 text-muted-foreground">{d.concurso ?? "—"}</td>
                  <td className="p-3">{d.qtde_aulas ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{fmtDate(d.due_date)}</td>
                  <td className="p-3 text-muted-foreground">{fmtDate(d.delivery_date)}</td>
                  <td className="p-3"><StatusBadge status={d.status} label={deliveryStatusLabel[d.status]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={!!openId} onOpenChange={(v) => !v && setOpenId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {detail && (
            <>
              <SheetHeader><SheetTitle>{detail.title}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <p className="text-muted-foreground">{detail.prof?.name} · {detail.teams?.name ?? "—"}</p>
                <div>
                  <Label>Status</Label>
                  <Select value={detail.status} onValueChange={(v) => updateStatus(detail.id, v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{deliveryStatusLabel[s]}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Link de entrega</Label>
                  <Input defaultValue={detail.link_entrega ?? ""} onBlur={(e) => updateLink(e.target.value)} />
                </div>
                <div>
                  <p className="mb-2 text-xs uppercase text-muted-foreground">Etapas</p>
                  {steps.map((s) => (
                    <div key={s.id} className="flex items-center justify-between border-b border-border py-2 last:border-b-0">
                      <p>{s.title}</p>
                      <Select value={s.status} onValueChange={(v) => updateStep(s.id, v)}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(stepStatusLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={openNew} onOpenChange={setOpenNew}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>Nova Demanda</SheetTitle></SheetHeader>
          <div className="mt-6 grid gap-4">
            <div>
              <Label>Professor *</Label>
              <Select value={form.professor_id} onValueChange={(v) => setForm({ ...form, professor_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{profs.map((p) => <SelectItem key={p.id} value={p.id}>{p.name ?? p.email}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Equipe</Label>
              <Select value={form.team_id} onValueChange={(v) => setForm({ ...form, team_id: v })}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>{teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Concurso</Label><Input value={form.concurso} onChange={(e) => setForm({ ...form, concurso: e.target.value })} /></div>
              <div><Label>Qtd. aulas</Label><Input type="number" value={form.qtde_aulas} onChange={(e) => setForm({ ...form, qtde_aulas: e.target.value })} /></div>
            </div>
            <div><Label>Prazo</Label><Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
            <Button className="w-full" onClick={create}>Criar Demanda</Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
