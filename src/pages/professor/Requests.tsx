import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Inbox, Plus, AlertTriangle, X } from "lucide-react";
import { fmtDate, solicitacaoStatusLabel, solicitacaoTypeLabel } from "@/lib/format";
import { toast } from "sonner";

const TYPES = [
  { value: "revisao_formato", label: "Revisão de Formato" },
  { value: "gerar_slides", label: "Geração de Slides" },
  { value: "selecao_questoes", label: "Seleção de Questões" },
  { value: "atualizar_questoes_bo", label: "Atualização de Questões no BO" },
  { value: "outro", label: "Outro" },
];

export default function ProfessorRequests() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [form, setForm] = useState({
    team_id: "", title: "", type: "revisao_formato", description: "", priority: "normal", due_date: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("solicitacoes").select("*")
      .eq("professor_id", user.id).order("created_at", { ascending: false });
    setItems(data ?? []);
  };

  useEffect(() => {
    if (!user) return;
    load();
    supabase.from("professor_teams").select("team_id, teams(id,name,has_triage)")
      .eq("professor_id", user.id).then(({ data }) => {
        setTeams((data ?? []).map((d: any) => d.teams).filter(Boolean));
      });
    const ch = supabase.channel("sol-prof")
      .on("postgres_changes", { event: "*", schema: "public", table: "solicitacoes", filter: `professor_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const submit = async () => {
    if (!user || !form.title || !form.description) {
      toast.error("Preencha título e descrição"); return;
    }
    setSubmitting(true);
    let attachment_path: string | null = null;
    if (file) {
      const path = `${user.id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("request-attachments").upload(path, file);
      if (upErr) { toast.error("Erro ao enviar anexo"); setSubmitting(false); return; }
      attachment_path = path;
    }
    const team = teams.find((t) => t.id === form.team_id);
    const initialStatus = team?.has_triage ? "em_triagem" : "aberta";
    const { data: sol, error } = await supabase.from("solicitacoes").insert({
      professor_id: user.id,
      team_id: form.team_id || null,
      title: form.title,
      type: form.type as any,
      description: form.description,
      priority: form.priority as any,
      due_date: form.due_date || null,
      attachment_path,
      status: initialStatus as any,
    }).select().single();
    if (error) {
      toast.error("Erro ao criar solicitação", { description: error.message });
      setSubmitting(false); return;
    }
    if (team?.has_triage && sol) {
      await supabase.from("triage_items").insert({ solicitacao_id: sol.id, status: "pendente" });
    }
    toast.success("Solicitação enviada");
    setOpen(false);
    setForm({ team_id: "", title: "", type: "revisao_formato", description: "", priority: "normal", due_date: "" });
    setFile(null);
    setSubmitting(false);
    load();
  };

  const cancelItem = async (id: string) => {
    const { error } = await supabase.from("solicitacoes").update({ status: "cancelada" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Solicitação cancelada");
    setDetailId(null); load();
  };

  const filtered = items.filter((r) => filterStatus === "all" || r.status === filterStatus);
  const detail = items.find((r) => r.id === detailId);

  return (
    <>
      <PageHeader title="Solicitações" description="Pedidos para a equipe de assistentes." action={
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Nova Solicitação</Button>
      } />

      <div className="mb-4 flex flex-wrap gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-52"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(solicitacaoStatusLabel).map(([k, v]) =>
              <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Inbox} title="Nenhuma solicitação ainda"
          description="Clique em 'Nova Solicitação' para começar."
          action={<Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" />Nova Solicitação</Button>} />
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-card">
          {filtered.map((r) => (
            <button key={r.id} onClick={() => setDetailId(r.id)}
              className="flex w-full items-center justify-between border-b border-border p-4 text-left last:border-b-0 hover:bg-muted/30">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-foreground">{r.title}</p>
                  {r.priority === "urgente" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-xs font-medium [color:hsl(var(--destructive))]">
                      <AlertTriangle className="h-3 w-3" /> Urgente
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{solicitacaoTypeLabel[r.type]} · {fmtDate(r.created_at)}</p>
              </div>
              <StatusBadge status={r.status} label={solicitacaoStatusLabel[r.status]} />
            </button>
          ))}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Nova Solicitação</SheetTitle>
            <SheetDescription>Preencha os detalhes da sua demanda.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <Label>Equipe</Label>
              <Select value={form.team_id} onValueChange={(v) => setForm({ ...form, team_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione uma equipe" /></SelectTrigger>
                <SelectContent>
                  {teams.length === 0 && <div className="p-2 text-sm text-muted-foreground">Nenhuma equipe vinculada</div>}
                  {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição *</Label>
              <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label className="cursor-pointer">Prioridade urgente</Label>
                <p className="text-xs text-muted-foreground">Sinaliza demanda crítica</p>
              </div>
              <Switch checked={form.priority === "urgente"}
                onCheckedChange={(v) => setForm({ ...form, priority: v ? "urgente" : "normal" })} />
            </div>
            <div>
              <Label>Data desejada</Label>
              <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div>
              <Label>Anexo</Label>
              <Input type="file" accept=".docx,.pptx,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <Button className="w-full" onClick={submit} disabled={submitting}>
              {submitting ? "Enviando..." : "Enviar Solicitação"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!detailId} onOpenChange={(v) => !v && setDetailId(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle>{detail.title}</SheetTitle>
                <SheetDescription>{solicitacaoTypeLabel[detail.type]}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <div className="flex items-center gap-2">
                  <StatusBadge status={detail.status} label={solicitacaoStatusLabel[detail.status]} />
                  {detail.priority === "urgente" && <StatusBadge status="atrasado" label="Urgente" />}
                </div>
                <div>
                  <p className="font-medium text-foreground">Descrição</p>
                  <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{detail.description}</p>
                </div>
                {detail.due_date && (
                  <div>
                    <p className="font-medium text-foreground">Data desejada</p>
                    <p className="text-muted-foreground">{fmtDate(detail.due_date)}</p>
                  </div>
                )}
                <div>
                  <p className="font-medium text-foreground">Criada em</p>
                  <p className="text-muted-foreground">{fmtDate(detail.created_at)}</p>
                </div>
                {(detail.status === "aberta" || detail.status === "em_triagem") && (
                  <Button variant="destructive" className="w-full" onClick={() => cancelItem(detail.id)}>
                    <X className="mr-2 h-4 w-4" /> Cancelar Solicitação
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
