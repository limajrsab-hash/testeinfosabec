import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Inbox } from "lucide-react";
import { fmtDate, solicitacaoStatusLabel, solicitacaoTypeLabel } from "@/lib/format";
import { toast } from "sonner";

const STATUSES = ["aberta", "em_triagem", "aprovada", "convertida", "rejeitada", "cancelada"];

export default function AssistantDemandas() {
  const [items, setItems] = useState<any[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [notes, setNotes] = useState("");

  const load = async () => {
    const { data } = await supabase.from("solicitacoes")
      .select("*, prof:professor_id(name,email), teams(name)")
      .order("created_at", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel("demandas-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "solicitacoes" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const detail = items.find((i) => i.id === openId);
  useEffect(() => { if (detail) { setStatus(detail.status); setNotes(""); } }, [openId]);

  const save = async () => {
    if (!detail) return;
    const { error } = await supabase.from("solicitacoes").update({ status: status as any }).eq("id", detail.id);
    if (error) return toast.error(error.message);
    if (status !== detail.status) {
      await supabase.from("notifications").insert({
        user_id: detail.professor_id, type: "status_atualizado",
        title: "Sua solicitação mudou de status",
        body: `${detail.title}: ${solicitacaoStatusLabel[status]}${notes ? ` — ${notes}` : ""}`,
        metadata: { solicitacao_id: detail.id },
      });
    }
    toast.success("Atualizada"); setOpenId(null); load();
  };

  return (
    <>
      <PageHeader title="Demandas" description="Solicitações recebidas dos professores." />
      {items.length === 0 ? (
        <EmptyState icon={Inbox} title="Sem demandas" description="Quando chegar uma solicitação, aparecerá aqui." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr><th className="p-3 text-left">Professor</th><th className="p-3 text-left">Equipe</th><th className="p-3 text-left">Tipo</th><th className="p-3 text-left">Título</th><th className="p-3 text-left">Prioridade</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Data</th></tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id} onClick={() => setOpenId(i.id)} className="cursor-pointer border-t border-border hover:bg-muted/20">
                  <td className="p-3">{i.prof?.name ?? i.prof?.email}</td>
                  <td className="p-3 text-muted-foreground">{i.teams?.name ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{solicitacaoTypeLabel[i.type]}</td>
                  <td className="p-3 font-medium">{i.title}</td>
                  <td className="p-3">{i.priority === "urgente" ? <span className="font-medium [color:hsl(var(--destructive))]">Urgente</span> : "—"}</td>
                  <td className="p-3"><StatusBadge status={i.status} label={solicitacaoStatusLabel[i.status]} /></td>
                  <td className="p-3 text-muted-foreground">{fmtDate(i.created_at)}</td>
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
                <div><p className="text-xs uppercase text-muted-foreground">Professor</p><p>{detail.prof?.name} · {detail.prof?.email}</p></div>
                <div><p className="text-xs uppercase text-muted-foreground">Tipo</p><p>{solicitacaoTypeLabel[detail.type]}</p></div>
                <div><p className="text-xs uppercase text-muted-foreground">Descrição</p><p className="whitespace-pre-wrap text-muted-foreground">{detail.description}</p></div>
                {detail.due_date && <div><p className="text-xs uppercase text-muted-foreground">Data desejada</p><p>{fmtDate(detail.due_date)}</p></div>}
                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{solicitacaoStatusLabel[s]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Notas internas (opcional, irá com a notificação)</Label>
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
