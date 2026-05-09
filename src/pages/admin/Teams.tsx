import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Layers, Plus, Save } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "sonner";

export default function AdminTeams() {
  const [teams, setTeams] = useState<any[]>([]);
  const [openNew, setOpenNew] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [assistants, setAssistants] = useState<any[]>([]);
  const [allAssistants, setAllAssistants] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", description: "", has_triage: false, has_custom_steps: false });

  const load = async () => {
    const { data } = await supabase.from("teams").select("*").order("name");
    setTeams(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name) return toast.error("Nome obrigatório");
    const { error } = await supabase.from("teams").insert(form);
    if (error) return toast.error(error.message);
    toast.success("Equipe criada"); setOpenNew(false);
    setForm({ name: "", description: "", has_triage: false, has_custom_steps: false }); load();
  };

  const openTeam = async (id: string) => {
    setOpenId(id);
    const [{ data: m }, { data: a }, { data: roles }] = await Promise.all([
      supabase.from("professor_teams").select("is_primary, profiles:professor_id(id,name,email)").eq("team_id", id),
      supabase.from("assistant_teams").select("assistant_id, profiles:assistant_id(id,name,email)").eq("team_id", id),
      supabase.from("user_roles").select("user_id, profiles:user_id(id,name,email)").eq("role", "assistant"),
    ]);
    setMembers(m ?? []);
    setAssistants(a ?? []);
    setAllAssistants((roles ?? []).map((r: any) => r.profiles).filter(Boolean));
  };

  const toggleAssistant = async (assistant_id: string, currentlyLinked: boolean) => {
    if (!openId) return;
    if (currentlyLinked) {
      await supabase.from("assistant_teams").delete().eq("assistant_id", assistant_id).eq("team_id", openId);
    } else {
      await supabase.from("assistant_teams").insert({ assistant_id, team_id: openId });
    }
    openTeam(openId);
  };

  const updateTeamFlags = async (patch: Partial<{ has_triage: boolean; has_custom_steps: boolean }>) => {
    if (!openId) return;
    const { error } = await supabase.from("teams").update(patch).eq("id", openId);
    if (error) return toast.error(error.message);
    toast.success("Equipe atualizada"); load();
  };

  const team = teams.find((t) => t.id === openId);

  return (
    <>
      <PageHeader title="Equipes" action={
        <Button onClick={() => setOpenNew(true)}><Plus className="mr-2 h-4 w-4" />Nova Equipe</Button>
      } />
      {teams.length === 0 ? (
        <EmptyState icon={Layers} title="Nenhuma equipe" description="Crie a primeira equipe."
          action={<Button onClick={() => setOpenNew(true)}>Nova Equipe</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((t) => (
            <button key={t.id} onClick={() => openTeam(t.id)}
              className="rounded-xl border border-border bg-card p-5 text-left shadow-card transition-all hover:shadow-elevated">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{t.name}</h3>
              {t.description && <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>}
            </button>
          ))}
        </div>
      )}

      <Sheet open={openNew} onOpenChange={setOpenNew}>
        <SheetContent>
          <SheetHeader><SheetTitle>Nova Equipe</SheetTitle></SheetHeader>
          <div className="mt-6 space-y-4">
            <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label className="cursor-pointer">Tem triagem</Label>
              <Switch checked={form.has_triage} onCheckedChange={(v) => setForm({ ...form, has_triage: v })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label className="cursor-pointer">Etapas customizadas</Label>
              <Switch checked={form.has_custom_steps} onCheckedChange={(v) => setForm({ ...form, has_custom_steps: v })} />
            </div>
            <Button className="w-full" onClick={create}>Criar</Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!openId} onOpenChange={(v) => !v && setOpenId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {team && (
            <>
              <SheetHeader><SheetTitle>{team.name}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <Label>Tem triagem</Label>
                    <Switch checked={team.has_triage} onCheckedChange={(v) => updateTeamFlags({ has_triage: v })} />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-border p-3">
                    <Label>Etapas customizadas</Label>
                    <Switch checked={team.has_custom_steps} onCheckedChange={(v) => updateTeamFlags({ has_custom_steps: v })} />
                  </div>
                </div>

                <div>
                  <p className="mb-3 text-xs uppercase text-muted-foreground">Professores vinculados</p>
                  {members.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum.</p> :
                    members.map((m, i) => (
                      <div key={i} className="border-b border-border py-2 text-sm last:border-b-0">
                        <p className="font-medium">{m.profiles?.name ?? m.profiles?.email}</p>
                        <p className="text-xs text-muted-foreground">{m.profiles?.email} {m.is_primary && "· principal"}</p>
                      </div>
                    ))}
                </div>

                <div>
                  <p className="mb-3 text-xs uppercase text-muted-foreground">Assistentes</p>
                  {allAssistants.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum assistente cadastrado.</p>
                  ) : (
                    allAssistants.map((a) => {
                      const linked = assistants.some((x) => x.assistant_id === a.id);
                      return (
                        <div key={a.id} className="flex items-center justify-between border-b border-border py-2 last:border-b-0">
                          <div className="text-sm">
                            <p className="font-medium">{a.name ?? a.email}</p>
                            <p className="text-xs text-muted-foreground">{a.email}</p>
                          </div>
                          <Switch checked={linked} onCheckedChange={() => toggleAssistant(a.id, linked)} />
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
