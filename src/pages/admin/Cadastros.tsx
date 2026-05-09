import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Layers, X } from "lucide-react";
import { fmtDate } from "@/lib/format";
import { toast } from "sonner";

type Team = { id: string; name: string; description: string | null; has_triage: boolean; has_custom_steps: boolean; is_legislacao: boolean };

export default function AdminCadastros() {
  const [tab, setTab] = useState("professores");
  const [teams, setTeams] = useState<Team[]>([]);
  const [profs, setProfs] = useState<any[]>([]);
  const [assist, setAssist] = useState<any[]>([]);

  const loadTeams = async () => {
    const { data } = await supabase.from("teams").select("*").order("name");
    setTeams((data ?? []) as Team[]);
  };
  const loadProfs = async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id, role")
      .in("role", ["professor", "professor_managed", "professor_autonomous"]);
    const ids = Array.from(new Set((roles ?? []).map((r) => r.user_id)));
    if (!ids.length) { setProfs([]); return; }
    const { data: ps } = await supabase.from("profiles").select("*").in("id", ids).order("name");
    const { data: pt } = await supabase.from("professor_teams").select("*, teams(id,name)").in("professor_id", ids);
    setProfs((ps ?? []).map((p) => {
      const r = (roles ?? []).find((x) => x.user_id === p.id);
      return { ...p, role: r?.role, teams: (pt ?? []).filter((t) => t.professor_id === p.id) };
    }));
  };
  const loadAssist = async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "assistant");
    const ids = Array.from(new Set((roles ?? []).map((r) => r.user_id)));
    if (!ids.length) { setAssist([]); return; }
    const { data: ps } = await supabase.from("profiles").select("*").in("id", ids).order("name");
    const { data: at } = await supabase.from("assistant_teams").select("*, teams(id,name)").in("assistant_id", ids);
    setAssist((ps ?? []).map((p) => ({
      ...p,
      teams: (at ?? []).filter((t) => t.assistant_id === p.id),
    })));
  };

  useEffect(() => { loadTeams(); loadProfs(); loadAssist(); }, []);

  return (
    <>
      <PageHeader title="Cadastros" description="Professores, assistentes e equipes." />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="professores">Professores</TabsTrigger>
          <TabsTrigger value="assistentes">Assistentes</TabsTrigger>
          <TabsTrigger value="equipes">Equipes</TabsTrigger>
        </TabsList>

        <TabsContent value="professores" className="mt-4">
          <ProfessoresTab profs={profs} teams={teams} reload={loadProfs} />
        </TabsContent>
        <TabsContent value="assistentes" className="mt-4">
          <AssistentesTab assist={assist} teams={teams} reload={loadAssist} />
        </TabsContent>
        <TabsContent value="equipes" className="mt-4">
          <EquipesTab teams={teams} reload={loadTeams} />
        </TabsContent>
      </Tabs>
    </>
  );
}

function ProfessoresTab({ profs, teams, reload }: any) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", role: "professor_managed",
    primary_team_id: "", team_ids: [] as string[],
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.email) return toast.error("E-mail obrigatório");
    setSaving(true);
    const { error } = await supabase.functions.invoke("invite-user", {
      body: {
        email: form.email, name: form.name, role: form.role,
        team_ids: form.team_ids, primary_team_id: form.primary_team_id || null,
      },
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Convite enviado por e-mail");
    setOpen(false);
    setForm({ name: "", email: "", role: "professor_managed", primary_team_id: "", team_ids: [] });
    reload();
  };

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Novo Professor</Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr><th className="p-3 text-left">Nome</th><th className="p-3 text-left">E-mail</th><th className="p-3 text-left">Tipo</th><th className="p-3 text-left">Equipe principal</th><th className="p-3 text-left">Desde</th></tr>
          </thead>
          <tbody>
            {profs.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Nenhum professor.</td></tr> :
              profs.map((p: any) => {
                const primary = p.teams.find((t: any) => t.is_primary);
                return (
                  <tr key={p.id} className="border-t border-border">
                    <td className="p-3 font-medium">{p.name ?? "—"}</td>
                    <td className="p-3 text-muted-foreground">{p.email}</td>
                    <td className="p-3">{p.role === "professor_autonomous" ? "Autônomo" : p.role === "professor_managed" ? "Gerenciado" : "Professor"}</td>
                    <td className="p-3">{primary?.teams?.name ?? "—"}</td>
                    <td className="p-3 text-muted-foreground">{fmtDate(p.created_at)}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>Novo Professor</SheetTitle><SheetDescription>Magic link será enviado por e-mail.</SheetDescription></SheetHeader>
          <div className="mt-6 space-y-4">
            <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>E-mail *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="professor_managed">Gerenciado</SelectItem>
                  <SelectItem value="professor_autonomous">Autônomo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Equipe principal</Label>
              <Select value={form.primary_team_id} onValueChange={(v) => setForm({ ...form, primary_team_id: v, team_ids: Array.from(new Set([...form.team_ids, v])) })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{teams.map((t: Team) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Equipes adicionais</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {teams.map((t: Team) => {
                  const sel = form.team_ids.includes(t.id);
                  return (
                    <button key={t.id} type="button" onClick={() => {
                      setForm({ ...form, team_ids: sel ? form.team_ids.filter((x) => x !== t.id) : [...form.team_ids, t.id] });
                    }} className={`rounded-full border px-3 py-1 text-xs ${sel ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>{t.name}</button>
                  );
                })}
              </div>
            </div>
            <Button className="w-full" onClick={submit} disabled={saving}>
              {saving ? "Enviando..." : "Criar e Enviar Convite"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function AssistentesTab({ assist, teams, reload }: any) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", generic: true, team_ids: [] as string[] });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.email) return toast.error("E-mail obrigatório");
    setSaving(true);
    const { error } = await supabase.functions.invoke("invite-user", {
      body: {
        email: form.email, name: form.name, role: "assistant",
        team_ids: form.generic ? [] : form.team_ids,
      },
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Convite enviado");
    setOpen(false);
    setForm({ name: "", email: "", generic: true, team_ids: [] });
    reload();
  };

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Novo Assistente</Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr><th className="p-3 text-left">Nome</th><th className="p-3 text-left">E-mail</th><th className="p-3 text-left">Tipo</th><th className="p-3 text-left">Equipes</th></tr>
          </thead>
          <tbody>
            {assist.length === 0 ? <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">Nenhum assistente.</td></tr> :
              assist.map((a: any) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="p-3 font-medium">{a.name ?? "—"}</td>
                  <td className="p-3 text-muted-foreground">{a.email}</td>
                  <td className="p-3">{a.teams.length === 0 ? "Genérico" : "Específico"}</td>
                  <td className="p-3 text-muted-foreground">{a.teams.map((t: any) => t.teams?.name).join(", ") || "—"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader><SheetTitle>Novo Assistente</SheetTitle></SheetHeader>
          <div className="mt-6 space-y-4">
            <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>E-mail *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div><Label>Genérico</Label><p className="text-xs text-muted-foreground">Vê todas as equipes</p></div>
              <Switch checked={form.generic} onCheckedChange={(v) => setForm({ ...form, generic: v })} />
            </div>
            {!form.generic && (
              <div>
                <Label>Equipes vinculadas</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {teams.map((t: Team) => {
                    const sel = form.team_ids.includes(t.id);
                    return (
                      <button key={t.id} type="button" onClick={() => {
                        setForm({ ...form, team_ids: sel ? form.team_ids.filter((x) => x !== t.id) : [...form.team_ids, t.id] });
                      }} className={`rounded-full border px-3 py-1 text-xs ${sel ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>{t.name}</button>
                    );
                  })}
                </div>
              </div>
            )}
            <Button className="w-full" onClick={submit} disabled={saving}>
              {saving ? "Enviando..." : "Criar e Enviar Convite"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function EquipesTab({ teams, reload }: any) {
  const [open, setOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", has_triage: false, has_custom_steps: false, is_legislacao: false });

  const create = async () => {
    if (!form.name) return toast.error("Nome obrigatório");
    const { error } = await supabase.from("teams").insert(form);
    if (error) return toast.error(error.message);
    toast.success("Equipe criada");
    setOpen(false);
    setForm({ name: "", description: "", has_triage: false, has_custom_steps: false, is_legislacao: false });
    reload();
  };

  const team = teams.find((t: Team) => t.id === openId);
  const updateTeam = async (patch: any) => {
    if (!openId) return;
    await supabase.from("teams").update(patch).eq("id", openId);
    toast.success("Atualizado"); reload();
  };

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Nova Equipe</Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {teams.map((t: Team) => (
          <button key={t.id} onClick={() => setOpenId(t.id)} className="rounded-xl border border-border bg-card p-5 text-left shadow-card hover:shadow-elevated">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-primary">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="font-semibold">{t.name}</h3>
            {t.description && <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {t.has_triage && <span className="rounded-full bg-info/15 px-2 py-0.5 text-xs [color:hsl(var(--info))]">Tem triagem</span>}
              {t.is_legislacao && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">Legislação</span>}
            </div>
          </button>
        ))}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader><SheetTitle>Nova Equipe</SheetTitle></SheetHeader>
          <div className="mt-6 space-y-4">
            <div><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label>Possui fluxo de triagem</Label>
              <Switch checked={form.has_triage} onCheckedChange={(v) => setForm({ ...form, has_triage: v })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label>É a Equipe Legislação</Label>
              <Switch checked={form.is_legislacao} onCheckedChange={(v) => setForm({ ...form, is_legislacao: v })} />
            </div>
            <Button className="w-full" onClick={create}>Criar</Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!openId} onOpenChange={(v) => !v && setOpenId(null)}>
        <SheetContent>
          {team && (
            <>
              <SheetHeader><SheetTitle>{team.name}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <Label>Triagem</Label>
                  <Switch checked={team.has_triage} onCheckedChange={(v) => updateTeam({ has_triage: v })} />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <Label>Etapas customizadas</Label>
                  <Switch checked={team.has_custom_steps} onCheckedChange={(v) => updateTeam({ has_custom_steps: v })} />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <Label>Equipe Legislação</Label>
                  <Switch checked={team.is_legislacao} onCheckedChange={(v) => updateTeam({ is_legislacao: v })} />
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
