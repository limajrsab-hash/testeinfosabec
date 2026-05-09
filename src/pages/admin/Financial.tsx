import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Check, Calculator } from "lucide-react";
import { fmtBRL, fmtDate, financialStatusLabel } from "@/lib/format";
import { calcular } from "@/lib/financial";
import { toast } from "sonner";

export default function AdminFinancial() {
  const [pendDel, setPendDel] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [profs, setProfs] = useState<any[]>([]);
  const [filters, setFilters] = useState({ professor: "all", status: "all", from: "", to: "" });
  const [openId, setOpenId] = useState<string | null>(null);

  const empty = {
    paginas_teoria: "0", questoes_ineditas_ce: "0", questoes_ineditas_mc: "0",
    questoes_concurso_ce: "0", questoes_concurso_mc: "0", valor_override: "",
  };
  const [form, setForm] = useState<any>(empty);

  const load = async () => {
    const [{ data: del }, { data: ent }, { data: pr }] = await Promise.all([
      supabase.from("deliveries").select("*, prof:professor_id(name), teams(name,is_legislacao)")
        .eq("status", "entregue"),
      supabase.from("financial_entries").select("*, prof:professor_id(name), del:delivery_id(title)")
        .order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, profiles:user_id(id,name,email)")
        .in("role", ["professor", "professor_managed", "professor_autonomous"]),
    ]);
    setEntries(ent ?? []);
    setProfs((pr ?? []).map((d: any) => d.profiles).filter(Boolean));
    // Apuração: deliveries entregues sem entry confirmada (valor_teoria + valor_questoes > 0)
    const apurados = new Set((ent ?? []).filter((e: any) => Number(e.valor_teoria) + Number(e.valor_questoes) > 0).map((e: any) => e.delivery_id));
    setPendDel((del ?? []).filter((d: any) => !apurados.has(d.id)));
  };
  useEffect(() => { load(); }, []);

  const detail = pendDel.find((d) => d.id === openId);
  const apuracao = useMemo(() => {
    if (!detail) return { valor_teoria: 0, valor_questoes: 0, total: 0 };
    return calcular({
      paginas_teoria: parseInt(form.paginas_teoria) || 0,
      questoes_ineditas_ce: parseInt(form.questoes_ineditas_ce) || 0,
      questoes_ineditas_mc: parseInt(form.questoes_ineditas_mc) || 0,
      questoes_concurso_ce: parseInt(form.questoes_concurso_ce) || 0,
      questoes_concurso_mc: parseInt(form.questoes_concurso_mc) || 0,
      is_legislacao: !!detail.teams?.is_legislacao,
    });
  }, [form, detail]);

  const totalFinal = form.valor_override ? parseFloat(form.valor_override) : apuracao.total;

  const apurar = async () => {
    if (!detail) return;
    // Se já existe entry pendente (placeholder) atualiza; senão insere.
    const existing = entries.find((e) => e.delivery_id === detail.id);
    const payload: any = {
      paginas_teoria: parseInt(form.paginas_teoria) || 0,
      questoes_ineditas_ce: parseInt(form.questoes_ineditas_ce) || 0,
      questoes_ineditas_mc: parseInt(form.questoes_ineditas_mc) || 0,
      questoes_concurso_ce: parseInt(form.questoes_concurso_ce) || 0,
      questoes_concurso_mc: parseInt(form.questoes_concurso_mc) || 0,
      valor_teoria: apuracao.valor_teoria,
      valor_questoes: apuracao.valor_questoes,
      valor_override: form.valor_override ? parseFloat(form.valor_override) : null,
      amount: totalFinal,
    };
    if (existing) {
      await supabase.from("financial_entries").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("financial_entries").insert({
        delivery_id: detail.id, professor_id: detail.professor_id, team_id: detail.team_id,
        status: "pendente", reference_month: new Date().toISOString().slice(0, 10),
        ...payload,
      });
    }
    toast.success("Apuração salva");
    setOpenId(null); setForm(empty); load();
  };

  const markPaid = async (id: string) => {
    await supabase.from("financial_entries").update({ status: "pago", paid_at: new Date().toISOString() }).eq("id", id);
    toast.success("Marcado como pago"); load();
  };

  const filteredEntries = entries.filter((e) =>
    (filters.professor === "all" || e.professor_id === filters.professor) &&
    (filters.status === "all" || e.status === filters.status) &&
    (!filters.from || (e.reference_month && e.reference_month >= filters.from)) &&
    (!filters.to || (e.reference_month && e.reference_month <= filters.to)));

  const totalApurado = filteredEntries.reduce((s, e) => s + Number(e.amount), 0);
  const totalPago = filteredEntries.filter((e) => e.status === "pago").reduce((s, e) => s + Number(e.amount), 0);

  return (
    <>
      <PageHeader title="Financeiro" description="Apuração de entregas e histórico de pagamentos." />

      <Tabs defaultValue="apuracao">
        <TabsList>
          <TabsTrigger value="apuracao">Apuração</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="assistentes">Assistentes</TabsTrigger>
        </TabsList>

        <TabsContent value="apuracao" className="mt-4">
          {pendDel.length === 0 ? (
            <EmptyState icon={DollarSign} title="Nada para apurar" description="Quando uma entrega for concluída, ela aparece aqui." />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr><th className="p-3 text-left">Professor</th><th className="p-3 text-left">Equipe</th><th className="p-3 text-left">Conteúdo</th><th className="p-3 text-left">Aulas</th><th className="p-3 text-left">Entrega</th><th className="p-3 text-right">Ação</th></tr>
                </thead>
                <tbody>
                  {pendDel.map((d) => (
                    <tr key={d.id} className="border-t border-border">
                      <td className="p-3">{d.prof?.name ?? "—"}</td>
                      <td className="p-3 text-muted-foreground">{d.teams?.name ?? "—"}</td>
                      <td className="p-3 font-medium">{d.title}</td>
                      <td className="p-3">{d.qtde_aulas ?? "—"}</td>
                      <td className="p-3 text-muted-foreground">{fmtDate(d.delivery_date)}</td>
                      <td className="p-3 text-right">
                        <Button size="sm" onClick={() => { setOpenId(d.id); setForm(empty); }}>
                          <Calculator className="mr-1 h-3.5 w-3.5" /> Apurar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select value={filters.professor} onValueChange={(v) => setFilters({ ...filters, professor: v })}>
              <SelectTrigger><SelectValue placeholder="Professor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {profs.map((p) => <SelectItem key={p.id} value={p.id}>{p.name ?? p.email}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                {Object.entries(financialStatusLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
            <Input type="date" value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card p-4 shadow-card">
              <p className="text-xs text-muted-foreground">Total apurado</p>
              <p className="mt-1 text-2xl font-semibold">{fmtBRL(totalApurado)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-card">
              <p className="text-xs text-muted-foreground">Total pago</p>
              <p className="mt-1 text-2xl font-semibold">{fmtBRL(totalPago)}</p>
            </div>
          </div>

          {filteredEntries.length === 0 ? (
            <EmptyState icon={DollarSign} title="Sem lançamentos" description="Apure entregas na aba Apuração." />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr><th className="p-3 text-left">Professor</th><th className="p-3 text-left">Conteúdo</th><th className="p-3 text-right">Teoria</th><th className="p-3 text-right">Questões</th><th className="p-3 text-right">Total</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Pago em</th><th></th></tr>
                </thead>
                <tbody>
                  {filteredEntries.map((e) => (
                    <tr key={e.id} className="border-t border-border">
                      <td className="p-3">{e.prof?.name ?? "—"}</td>
                      <td className="p-3 font-medium">{e.del?.title ?? "—"}</td>
                      <td className="p-3 text-right">{fmtBRL(e.valor_teoria)}</td>
                      <td className="p-3 text-right">{fmtBRL(e.valor_questoes)}</td>
                      <td className="p-3 text-right font-semibold">{fmtBRL(e.amount)}</td>
                      <td className="p-3"><StatusBadge status={e.status} label={financialStatusLabel[e.status]} /></td>
                      <td className="p-3 text-muted-foreground">{fmtDate(e.paid_at)}</td>
                      <td className="p-3 text-right">
                        {e.status === "pendente" && (
                          <Button size="sm" variant="outline" onClick={() => markPaid(e.id)}><Check className="mr-1 h-3 w-3" /> Pago</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="assistentes" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-card">
            Valores fixos dos assistentes — em breve.
          </div>
        </TabsContent>
      </Tabs>

      <Sheet open={!!openId} onOpenChange={(v) => !v && setOpenId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle>Apurar — {detail.title}</SheetTitle>
                <SheetDescription>{detail.prof?.name} · {detail.teams?.name ?? "—"}{detail.teams?.is_legislacao ? " · Legislação" : ""}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 grid gap-4">
                <div><Label>Páginas de teoria</Label><Input type="number" value={form.paginas_teoria} onChange={(e) => setForm({ ...form, paginas_teoria: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Inéditas C/E</Label><Input type="number" value={form.questoes_ineditas_ce} onChange={(e) => setForm({ ...form, questoes_ineditas_ce: e.target.value })} /></div>
                  <div><Label>Inéditas MC</Label><Input type="number" value={form.questoes_ineditas_mc} onChange={(e) => setForm({ ...form, questoes_ineditas_mc: e.target.value })} /></div>
                  <div><Label>Concurso C/E</Label><Input type="number" value={form.questoes_concurso_ce} onChange={(e) => setForm({ ...form, questoes_concurso_ce: e.target.value })} /></div>
                  <div><Label>Concurso MC</Label><Input type="number" value={form.questoes_concurso_mc} onChange={(e) => setForm({ ...form, questoes_concurso_mc: e.target.value })} /></div>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                  <div className="flex justify-between"><span>Valor teoria</span><span>{fmtBRL(apuracao.valor_teoria)}</span></div>
                  <div className="flex justify-between"><span>Valor questões</span><span>{fmtBRL(apuracao.valor_questoes)}</span></div>
                  <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold"><span>Total calculado</span><span>{fmtBRL(apuracao.total)}</span></div>
                </div>

                <div>
                  <Label>Ajuste manual (opcional)</Label>
                  <Input type="number" step="0.01" value={form.valor_override} onChange={(e) => setForm({ ...form, valor_override: e.target.value })} placeholder="Sobrepõe o total calculado" />
                </div>

                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm font-semibold text-primary flex justify-between">
                  <span>Total a pagar</span><span>{fmtBRL(totalFinal)}</span>
                </div>

                <Button className="w-full" onClick={apurar}>Confirmar apuração</Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
