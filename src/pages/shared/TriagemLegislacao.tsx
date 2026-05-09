import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ListTodo, Plus, Save } from "lucide-react";
import { fmtDate, triageStatusLabel } from "@/lib/format";
import { toast } from "sonner";

const STATUSES = ["analise_interesse", "lancado", "restringido", "redirecionado"] as const;

export default function TriagemLegislacao({ adminMode = false }: { adminMode?: boolean }) {
  const [items, setItems] = useState<any[]>([]);
  const [profs, setProfs] = useState<any[]>([]);
  const [filters, setFilters] = useState({ status: "all", professor: "all", from: "", to: "" });
  const [openNew, setOpenNew] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const empty = {
    concurso: "", banca: "", nivel: "", data_prova: "", data_envio: new Date().toISOString().slice(0, 10),
    qtde_questoes_legislacao: "", professor_responsavel_id: "", disponibilidade: "",
    notes: "", status: "analise_interesse",
  };
  const [form, setForm] = useState<any>(empty);

  const load = async () => {
    const { data } = await supabase.from("triage_items")
      .select("*, prof:professor_responsavel_id(name,email)")
      .order("data_envio", { ascending: false });
    setItems(data ?? []);
  };

  useEffect(() => {
    load();
    supabase.from("user_roles").select("user_id, profiles:user_id(id,name,email)")
      .in("role", ["professor", "professor_managed", "professor_autonomous"])
      .then(({ data }) => setProfs((data ?? []).map((d: any) => d.profiles).filter(Boolean)));
    const ch = supabase.channel("triagem-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "triage_items" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const save = async () => {
    if (!form.concurso) return toast.error("Concurso é obrigatório");
    const payload: any = {
      concurso: form.concurso, banca: form.banca || null, nivel: form.nivel || null,
      data_prova: form.data_prova || null, data_envio: form.data_envio || null,
      qtde_questoes_legislacao: form.qtde_questoes_legislacao ? parseInt(form.qtde_questoes_legislacao) : null,
      professor_responsavel_id: form.professor_responsavel_id || null,
      disponibilidade: form.disponibilidade || null,
      notes: form.notes || null,
      status: form.status,
    };
    if (openId) {
      const { error } = await supabase.from("triage_items").update({ ...payload, decided_at: new Date().toISOString() }).eq("id", openId);
      if (error) return toast.error(error.message);
      toast.success("Item atualizado");
    } else {
      // precisa de solicitacao_id (FK NOT NULL na tabela). Cria solicitação placeholder.
      const { data: sol, error: solErr } = await supabase.from("solicitacoes").insert({
        professor_id: form.professor_responsavel_id || (await supabase.auth.getUser()).data.user?.id,
        title: form.concurso,
        description: `Triagem Legislação — ${form.concurso}`,
        type: "outro" as any,
        status: "em_triagem" as any,
      }).select().single();
      if (solErr) return toast.error(solErr.message);
      const { error } = await supabase.from("triage_items").insert({ ...payload, solicitacao_id: sol!.id });
      if (error) return toast.error(error.message);
      toast.success("Item criado");
    }
    setOpenNew(false); setOpenId(null); setForm(empty); load();
  };

  const item = items.find((i) => i.id === openId);
  useEffect(() => {
    if (item) {
      setForm({
        concurso: item.concurso ?? "", banca: item.banca ?? "", nivel: item.nivel ?? "",
        data_prova: item.data_prova ?? "", data_envio: item.data_envio ?? "",
        qtde_questoes_legislacao: item.qtde_questoes_legislacao?.toString() ?? "",
        professor_responsavel_id: item.professor_responsavel_id ?? "",
        disponibilidade: item.disponibilidade ?? "",
        notes: item.notes ?? "",
        status: item.status ?? "analise_interesse",
      });
    }
  }, [openId]);

  const filtered = items.filter((i) =>
    (filters.status === "all" || i.status === filters.status) &&
    (filters.professor === "all" || i.professor_responsavel_id === filters.professor) &&
    (!filters.from || (i.data_envio && i.data_envio >= filters.from)) &&
    (!filters.to || (i.data_envio && i.data_envio <= filters.to)));

  const counts = STATUSES.map((s) => ({ s, n: items.filter((i) => i.status === s).length }));

  return (
    <>
      <PageHeader title="Triagem Legislação" description="Triagem de concursos para a Equipe Legislação." action={
        <Button onClick={() => { setForm(empty); setOpenNew(true); }}><Plus className="mr-2 h-4 w-4" /> Novo Item</Button>
      } />

      {adminMode && (
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {counts.map((c) => (
            <div key={c.s} className="rounded-xl border border-border bg-card p-4 shadow-card">
              <p className="text-xs text-muted-foreground">{triageStatusLabel[c.s]}</p>
              <p className="mt-1 text-2xl font-semibold">{c.n}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{triageStatusLabel[s]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.professor} onValueChange={(v) => setFilters({ ...filters, professor: v })}>
          <SelectTrigger><SelectValue placeholder="Professor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os professores</SelectItem>
            {profs.map((p) => <SelectItem key={p.id} value={p.id}>{p.name ?? p.email}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
        <Input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ListTodo} title="Nenhum item de triagem" description="Cadastre o primeiro concurso." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Envio</th>
                <th className="p-3 text-left">Concurso</th>
                <th className="p-3 text-left">Banca</th>
                <th className="p-3 text-left">Nível</th>
                <th className="p-3 text-left">Prova</th>
                <th className="p-3 text-left">Qtd</th>
                <th className="p-3 text-left">Professor</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Disp.</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.id} onClick={() => setOpenId(i.id)} className="cursor-pointer border-t border-border hover:bg-muted/20">
                  <td className="p-3 text-muted-foreground">{fmtDate(i.data_envio)}</td>
                  <td className="p-3 font-medium">{i.concurso ?? "—"}</td>
                  <td className="p-3">{i.banca ?? "—"}</td>
                  <td className="p-3">{i.nivel ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{fmtDate(i.data_prova)}</td>
                  <td className="p-3">{i.qtde_questoes_legislacao ?? "—"}</td>
                  <td className="p-3">{i.prof?.name ?? i.prof?.email ?? "—"}</td>
                  <td className="p-3"><StatusBadge status={i.status} label={triageStatusLabel[i.status]} /></td>
                  <td className="p-3 text-muted-foreground">{i.disponibilidade ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Sheet open={openNew || !!openId} onOpenChange={(v) => { if (!v) { setOpenNew(false); setOpenId(null); } }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>{openId ? "Editar Item" : "Novo Item de Triagem"}</SheetTitle></SheetHeader>
          <div className="mt-6 grid gap-4">
            <div><Label>Concurso *</Label><Input value={form.concurso} onChange={(e) => setForm({ ...form, concurso: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Banca</Label><Input value={form.banca} onChange={(e) => setForm({ ...form, banca: e.target.value })} /></div>
              <div><Label>Nível</Label><Input value={form.nivel} onChange={(e) => setForm({ ...form, nivel: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Data envio</Label><Input type="date" value={form.data_envio} onChange={(e) => setForm({ ...form, data_envio: e.target.value })} /></div>
              <div><Label>Data prova</Label><Input type="date" value={form.data_prova} onChange={(e) => setForm({ ...form, data_prova: e.target.value })} /></div>
            </div>
            <div><Label>Qtd. questões de legislação</Label><Input type="number" value={form.qtde_questoes_legislacao} onChange={(e) => setForm({ ...form, qtde_questoes_legislacao: e.target.value })} /></div>
            <div>
              <Label>Professor responsável</Label>
              <Select value={form.professor_responsavel_id} onValueChange={(v) => setForm({ ...form, professor_responsavel_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{profs.map((p) => <SelectItem key={p.id} value={p.id}>{p.name ?? p.email}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Disponibilidade</Label><Input value={form.disponibilidade} onChange={(e) => setForm({ ...form, disponibilidade: e.target.value })} placeholder="Ex.: até 30/06" /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{triageStatusLabel[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Observações</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <Button className="w-full" onClick={save}><Save className="mr-2 h-4 w-4" /> Salvar</Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
