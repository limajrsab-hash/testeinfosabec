import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Plus, X } from "lucide-react";
import { fmtDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function AdminProfessors() {
  const [profs, setProfs] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [addTeamId, setAddTeamId] = useState("");

  const load = async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id")
      .in("role", ["professor", "professor_managed", "professor_autonomous"]);
    const ids = Array.from(new Set((roles ?? []).map((r) => r.user_id)));
    if (!ids.length) { setProfs([]); return; }
    const { data: ps } = await supabase.from("profiles").select("*").in("id", ids).order("name");
    const { data: pt } = await supabase.from("professor_teams").select("*, teams(id,name)").in("professor_id", ids);
    const merged = (ps ?? []).map((p) => ({
      ...p,
      teams: (pt ?? []).filter((t) => t.professor_id === p.id),
    }));
    setProfs(merged);
  };
  useEffect(() => {
    load();
    supabase.from("teams").select("*").order("name").then(({ data }) => setTeams(data ?? []));
  }, []);

  const openDetail = async (p: any) => {
    setOpenId(p.id);
    const [reqs, sched] = await Promise.all([
      supabase.from("requests").select("*").eq("professor_id", p.id).order("created_at", { ascending: false }).limit(5),
      supabase.from("schedule_items").select("*").eq("professor_id", p.id)
        .in("status", ["pendente_aprovacao", "aprovado"]).order("proposed_date").limit(5),
    ]);
    setDetail({ ...p, requests: reqs.data ?? [], schedule: sched.data ?? [] });
  };

  const addTeam = async () => {
    if (!addTeamId || !openId) return;
    const { error } = await supabase.from("professor_teams").insert({ professor_id: openId, team_id: addTeamId });
    if (error) return toast.error(error.message);
    toast.success("Equipe adicionada");
    setAddTeamId("");
    await load();
    const updated = profs.find((p) => p.id === openId);
    if (updated) openDetail(updated);
  };
  const removeTeam = async (ptId: string) => {
    await supabase.from("professor_teams").delete().eq("id", ptId);
    toast.success("Removida");
    await load();
    const updated = profs.find((p) => p.id === openId);
    if (updated) openDetail(updated);
  };

  return (
    <>
      <PageHeader title="Professores" description="Gestão dos profissionais cadastrados." action={
        <Tooltip>
          <TooltipTrigger asChild><Button variant="outline" disabled><Info className="mr-2 h-4 w-4" /> Como cadastrar?</Button></TooltipTrigger>
          <TooltipContent className="max-w-xs">Novos professores são criados diretamente no painel de backend (Lovable Cloud → Users).</TooltipContent>
        </Tooltip>
      } />

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr><th className="p-3 text-left">Nome</th><th className="p-3 text-left">E-mail</th><th className="p-3 text-left">Equipe principal</th><th className="p-3 text-left">Outras</th><th className="p-3 text-left">Desde</th></tr>
          </thead>
          <tbody>
            {profs.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhum professor.</td></tr> :
              profs.map((p) => {
                const primary = p.teams.find((t: any) => t.is_primary);
                const others = p.teams.filter((t: any) => !t.is_primary);
                return (
                  <tr key={p.id} onClick={() => openDetail(p)} className="cursor-pointer border-t border-border hover:bg-muted/20">
                    <td className="p-3 font-medium">{p.name ?? "—"}</td>
                    <td className="p-3 text-muted-foreground">{p.email}</td>
                    <td className="p-3">{primary?.teams?.name ?? "—"}</td>
                    <td className="p-3 text-muted-foreground">{others.map((t: any) => t.teams?.name).join(", ") || "—"}</td>
                    <td className="p-3 text-muted-foreground">{fmtDate(p.created_at)}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <Sheet open={!!openId} onOpenChange={(v) => { if (!v) { setOpenId(null); setDetail(null); } }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle>{detail.name ?? detail.email}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">E-mail</p>
                  <p className="text-sm">{detail.email}</p>
                </div>
                <div>
                  <p className="mb-2 text-xs uppercase text-muted-foreground">Equipes vinculadas</p>
                  <div className="space-y-2">
                    {detail.teams.map((t: any) => (
                      <div key={t.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                        <span>{t.teams?.name} {t.is_primary && <span className="ml-1 text-xs text-primary">(principal)</span>}</span>
                        <Button size="icon" variant="ghost" onClick={() => removeTeam(t.id)}><X className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Select value={addTeamId} onValueChange={setAddTeamId}>
                      <SelectTrigger><SelectValue placeholder="Adicionar equipe" /></SelectTrigger>
                      <SelectContent>
                        {teams.filter((t) => !detail.teams.some((dt: any) => dt.team_id === t.id))
                          .map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button onClick={addTeam} disabled={!addTeamId}><Plus className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs uppercase text-muted-foreground">Últimas solicitações</p>
                  {detail.requests.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma.</p> :
                    detail.requests.map((r: any) => (
                      <div key={r.id} className="border-b border-border py-2 text-sm last:border-b-0">
                        <p className="font-medium">{r.title}</p>
                        <p className="text-xs text-muted-foreground">{fmtDate(r.created_at)} · {r.status}</p>
                      </div>
                    ))}
                </div>
                <div>
                  <p className="mb-2 text-xs uppercase text-muted-foreground">Próximos itens de cronograma</p>
                  {detail.schedule.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum.</p> :
                    detail.schedule.map((s: any) => (
                      <div key={s.id} className="border-b border-border py-2 text-sm last:border-b-0">
                        <p className="font-medium">{s.title}</p>
                        <p className="text-xs text-muted-foreground">{fmtDate(s.proposed_date)} · {s.status}</p>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
