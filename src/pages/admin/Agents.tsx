import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { EmptyState } from "@/components/EmptyState";
import { Bot, Plus, Play } from "lucide-react";
import { fmtDateTime } from "@/lib/format";
import { toast } from "sonner";

export default function AdminAgents() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [openNew, setOpenNew] = useState(false);
  const [trigger, setTrigger] = useState<any>(null);
  const [form, setForm] = useState({ name: "", webhook_url: "", description: "" });
  const [payload, setPayload] = useState("{}");

  const load = async () => {
    const [a, r] = await Promise.all([
      supabase.from("ai_agents").select("*").order("created_at", { ascending: false }),
      supabase.from("agent_runs").select("*, ai_agents(name), profiles:triggered_by(name)").order("created_at", { ascending: false }).limit(20),
    ]);
    setAgents(a.data ?? []); setRuns(r.data ?? []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name || !form.webhook_url) return toast.error("Nome e webhook obrigatórios");
    const { error } = await supabase.from("ai_agents").insert(form);
    if (error) return toast.error(error.message);
    toast.success("Agente criado"); setOpenNew(false); setForm({ name: "", webhook_url: "", description: "" }); load();
  };

  const toggleStatus = async (a: any) => {
    await supabase.from("ai_agents").update({ status: a.status === "active" ? "paused" : "active" }).eq("id", a.id);
    load();
  };

  const run = async () => {
    if (!trigger || !user) return;
    let parsed: any = {};
    try { parsed = JSON.parse(payload); } catch { return toast.error("JSON inválido"); }
    const start = Date.now();
    let runStatus: "success" | "error" = "success";
    let summary = "Ok";
    try {
      const r = await fetch(trigger.webhook_url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed) });
      if (!r.ok) { runStatus = "error"; summary = `HTTP ${r.status}`; }
    } catch (e: any) { runStatus = "error"; summary = e.message; }
    await supabase.from("agent_runs").insert({
      agent_id: trigger.id, triggered_by: user.id, status: runStatus,
      input_payload: parsed, output_summary: summary, duration_ms: Date.now() - start,
    });
    toast[runStatus === "success" ? "success" : "error"]("Execução " + (runStatus === "success" ? "ok" : "com erro"));
    setTrigger(null); setPayload("{}"); load();
  };

  return (
    <>
      <PageHeader title="Agentes de IA" action={
        <Button onClick={() => setOpenNew(true)}><Plus className="mr-2 h-4 w-4" />Novo Agente</Button>
      } />

      {agents.length === 0 ? (
        <EmptyState icon={Bot} title="Nenhum agente cadastrado" description="Configure seu primeiro agente."
          action={<Button onClick={() => setOpenNew(true)}>Novo Agente</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((a) => (
            <div key={a.id} className="rounded-xl border border-border bg-card p-5 shadow-card">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
                  <Bot className="h-5 w-5" />
                </div>
                <Switch checked={a.status === "active"} onCheckedChange={() => toggleStatus(a)} />
              </div>
              <h3 className="font-semibold">{a.name}</h3>
              {a.description && <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>}
              <div className="mt-3 flex items-center justify-between">
                <StatusBadge status={a.status} />
                <Button size="sm" variant="outline" onClick={() => setTrigger(a)}><Play className="mr-1 h-3.5 w-3.5" />Acionar</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Execuções Recentes</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr><th className="p-3 text-left">Agente</th><th className="p-3 text-left">Por</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Duração</th><th className="p-3 text-left">Resumo</th><th className="p-3 text-left">Quando</th></tr>
            </thead>
            <tbody>
              {runs.length === 0 ? <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Sem execuções.</td></tr> :
                runs.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="p-3 font-medium">{r.ai_agents?.name}</td>
                    <td className="p-3">{r.profiles?.name ?? "—"}</td>
                    <td className="p-3"><StatusBadge status={r.status} /></td>
                    <td className="p-3 text-muted-foreground">{r.duration_ms ? `${r.duration_ms}ms` : "—"}</td>
                    <td className="p-3 text-muted-foreground">{r.output_summary}</td>
                    <td className="p-3 text-muted-foreground">{fmtDateTime(r.created_at)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      <Sheet open={openNew} onOpenChange={setOpenNew}>
        <SheetContent>
          <SheetHeader><SheetTitle>Novo Agente</SheetTitle></SheetHeader>
          <div className="mt-6 space-y-4">
            <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Webhook URL</Label><Input value={form.webhook_url} onChange={(e) => setForm({ ...form, webhook_url: e.target.value })} /></div>
            <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <Button className="w-full" onClick={create}>Criar</Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!trigger} onOpenChange={(v) => !v && setTrigger(null)}>
        <SheetContent>
          {trigger && (
            <>
              <SheetHeader><SheetTitle>Acionar — {trigger.name}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-4">
                <div>
                  <Label>Payload (JSON)</Label>
                  <Textarea rows={10} value={payload} onChange={(e) => setPayload(e.target.value)} className="font-mono text-xs" />
                </div>
                <Button className="w-full" onClick={run}><Play className="mr-2 h-4 w-4" />Executar</Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
