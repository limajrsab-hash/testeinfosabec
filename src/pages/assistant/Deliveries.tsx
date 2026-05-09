import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, ExternalLink, Save } from "lucide-react";
import { fmtDate, deliveryStatusLabel, stepStatusLabel } from "@/lib/format";
import { toast } from "sonner";

export default function AssistantDeliveries() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [steps, setSteps] = useState<any[]>([]);
  const [link, setLink] = useState("");
  const [status, setStatus] = useState("pendente");

  const load = async () => {
    const { data } = await supabase.from("deliveries").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
  };

  useEffect(() => {
    if (!user) return;
    load();
    const ch = supabase.channel("del-assist")
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  useEffect(() => {
    if (!openId) return;
    const item = items.find((i) => i.id === openId);
    if (item) { setLink(item.link_entrega ?? ""); setStatus(item.status); }
    supabase.from("delivery_steps").select("*").eq("delivery_id", openId)
      .order("order_index").then(({ data }) => setSteps(data ?? []));
  }, [openId, items]);

  const item = items.find((i) => i.id === openId);

  const save = async () => {
    if (!item) return;
    const { error } = await supabase.from("deliveries").update({
      link_entrega: link || null, status: status as any,
    }).eq("id", item.id);
    if (error) return toast.error(error.message);
    toast.success("Entrega atualizada");
    setOpenId(null); load();
  };

  const updateStep = async (id: string, newStatus: string) => {
    const patch: any = { status: newStatus };
    if (newStatus === "concluida") patch.completed_at = new Date().toISOString();
    const { error } = await supabase.from("delivery_steps").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    setSteps((s) => s.map((st) => st.id === id ? { ...st, ...patch } : st));
  };

  return (
    <>
      <PageHeader title="Entregas" description="Gerencie produção e entrega aos professores." />
      {items.length === 0 ? (
        <EmptyState icon={Package} title="Sem entregas"
          description="Aprove uma solicitação na Triagem para gerar uma entrega." />
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-card">
          {items.map((d) => (
            <button key={d.id} onClick={() => setOpenId(d.id)}
              className="flex w-full items-center justify-between border-b border-border p-4 text-left last:border-b-0 hover:bg-muted/30">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{d.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {d.due_date ? `Prazo: ${fmtDate(d.due_date)}` : fmtDate(d.created_at)}
                </p>
              </div>
              <StatusBadge status={d.status} label={deliveryStatusLabel[d.status]} />
            </button>
          ))}
        </div>
      )}

      <Sheet open={!!openId} onOpenChange={(v) => !v && setOpenId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {item && (
            <>
              <SheetHeader><SheetTitle>{item.title}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-4">
                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(deliveryStatusLabel).map(([k, v]) =>
                        <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Link de entrega</Label>
                  <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Ao preencher, o status muda para "entregue" automaticamente.
                  </p>
                </div>
                <Button className="w-full" onClick={save}>
                  <Save className="mr-2 h-4 w-4" /> Salvar
                </Button>

                {steps.length > 0 && (
                  <div className="pt-4">
                    <p className="mb-2 text-sm font-medium text-foreground">Etapas</p>
                    <div className="space-y-2">
                      {steps.map((s) => (
                        <div key={s.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                          <p className="text-sm">{s.title}</p>
                          <Select value={s.status} onValueChange={(v) => updateStep(s.id, v)}>
                            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.entries(stepStatusLabel).map(([k, v]) =>
                                <SelectItem key={k} value={k}>{v}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
