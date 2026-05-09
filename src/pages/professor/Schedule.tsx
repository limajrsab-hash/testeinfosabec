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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Calendar, Plus } from "lucide-react";
import { fmtDate, scheduleStatusLabel } from "@/lib/format";
import { toast } from "sonner";

export default function ProfessorSchedule() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", proposed_date: "", linked_request_id: "" });

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("schedule_items").select("*")
      .eq("professor_id", user.id).order("proposed_date", { ascending: true });
    setItems(data ?? []);
  };

  useEffect(() => {
    if (!user) return;
    load();
    supabase.from("requests").select("id,title").eq("professor_id", user.id)
      .order("created_at", { ascending: false }).then(({ data }) => setRequests(data ?? []));
  }, [user]);

  const submit = async () => {
    if (!user || !form.title || !form.proposed_date) {
      toast.error("Preencha título e data proposta");
      return;
    }
    const { error } = await supabase.from("schedule_items").insert({
      professor_id: user.id,
      created_by: user.id,
      title: form.title,
      description: form.description || null,
      proposed_date: form.proposed_date,
      linked_request_id: form.linked_request_id || null,
    });
    if (error) return toast.error(error.message);
    const { data: admins } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
    if (admins?.length) {
      await supabase.from("notifications").insert(admins.map((a) => ({
        user_id: a.user_id, type: "nova_proposta_cronograma",
        title: "Nova proposta de cronograma", body: form.title,
      })));
    }
    toast.success("Proposta enviada");
    setOpen(false);
    setForm({ title: "", description: "", proposed_date: "", linked_request_id: "" });
    load();
  };

  return (
    <>
      <PageHeader title="Meu Cronograma" action={
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Propor Nova Data</Button>
      } />

      {items.length === 0 ? (
        <EmptyState icon={Calendar} title="Cronograma vazio"
          description="Proponha sua primeira data de entrega."
          action={<Button onClick={() => setOpen(true)}>Propor Nova Data</Button>} />
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-card">
          {items.map((s) => (
            <div key={s.id} className="flex items-center justify-between border-b border-border p-4 last:border-b-0">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{s.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Proposta: {fmtDate(s.proposed_date)}
                  {s.approved_date && ` · Aprovada: ${fmtDate(s.approved_date)}`}
                </p>
              </div>
              <StatusBadge status={s.status} label={scheduleStatusLabel[s.status]} />
            </div>
          ))}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Propor Nova Data de Entrega</SheetTitle>
            <SheetDescription>A administração revisará sua proposta.</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <Label>Data proposta *</Label>
              <Input type="date" value={form.proposed_date}
                onChange={(e) => setForm({ ...form, proposed_date: e.target.value })} />
            </div>
            <div>
              <Label>Vincular a solicitação (opcional)</Label>
              <Select value={form.linked_request_id} onValueChange={(v) => setForm({ ...form, linked_request_id: v })}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  {requests.map((r) => <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={submit}>Enviar Proposta</Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
