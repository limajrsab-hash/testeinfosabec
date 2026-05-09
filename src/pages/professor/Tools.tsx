import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import { Presentation, FileCheck2, Search, Download, Loader2 } from "lucide-react";
import { fmtRelative, jobStatusLabel, jobTypeLabel } from "@/lib/format";
import { toast } from "sonner";

const TOOLS = [
  { type: "gerar_pptx", title: "Gerador de Slides", icon: Presentation,
    description: "Envie o conteúdo e gere automaticamente uma apresentação no padrão Estratégia.", accept: ".docx" },
  { type: "formatar_questoes", title: "Formatação de Questões", icon: FileCheck2,
    description: "Cole suas questões e receba o arquivo formatado no padrão editorial.", accept: ".docx" },
  { type: "revisar_docx", title: "Revisão de Material", icon: Search,
    description: "Envie seu material e receba uma revisão de formato automatizada.", accept: ".docx" },
];

const BANCAS = ["FCC", "VUNESP", "FGV", "CEBRASPE", "Multibancas"];

export default function ProfessorTools() {
  const { user } = useAuth();
  const [openTool, setOpenTool] = useState<string | null>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [profileName, setProfileName] = useState("");
  const [form, setForm] = useState({ banca: "FCC", inputMode: "file" as "file" | "text", text: "" });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadJobs = async () => {
    if (!user) return;
    const { data } = await supabase.from("jobs").select("*").eq("created_by", user.id)
      .order("created_at", { ascending: false }).limit(10);
    setJobs(data ?? []);
  };

  useEffect(() => {
    if (!user) return;
    loadJobs();
    supabase.from("profiles").select("name").eq("id", user.id).maybeSingle()
      .then(({ data }) => setProfileName(data?.name ?? ""));
    const ch = supabase.channel("user-jobs")
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs", filter: `created_by=eq.${user.id}` },
        () => loadJobs())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const tool = TOOLS.find((t) => t.type === openTool);

  const submit = async () => {
    if (!user || !tool) return;
    setSubmitting(true);
    let input_file_path: string | null = null;
    if (form.inputMode === "file") {
      if (!file) { toast.error("Selecione um arquivo"); setSubmitting(false); return; }
      const path = `${user.id}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("job-files").upload(path, file);
      if (error) { toast.error("Erro no upload"); setSubmitting(false); return; }
      input_file_path = path;
    } else if (!form.text.trim()) {
      toast.error("Cole o texto"); setSubmitting(false); return;
    }
    const { error } = await supabase.from("jobs").insert({
      created_by: user.id,
      type: tool.type as any,
      input_file_path,
      input_text: form.inputMode === "text" ? form.text : null,
      metadata: { banca: form.banca, professor_name: profileName },
    });
    if (error) { toast.error(error.message); setSubmitting(false); return; }
    toast.success("Job enviado para processamento");
    setOpenTool(null); setFile(null); setForm({ banca: "FCC", inputMode: "file", text: "" });
    setSubmitting(false);
    loadJobs();
  };

  const downloadOutput = async (path: string) => {
    const { data, error } = await supabase.storage.from("job-files").createSignedUrl(path, 60);
    if (error || !data) return toast.error("Não foi possível gerar link");
    window.open(data.signedUrl, "_blank");
  };

  return (
    <>
      <PageHeader title="Ferramentas" description="Acelere suas demandas com automações." />

      <div className="grid gap-4 md:grid-cols-3">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.type} className="rounded-xl border border-border bg-card p-6 shadow-card transition-all hover:shadow-elevated">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-foreground">{t.title}</h3>
              <p className="mt-1 mb-4 text-sm text-muted-foreground">{t.description}</p>
              <Button variant="secondary" className="w-full" onClick={() => setOpenTool(t.type)}>
                Abrir Ferramenta
              </Button>
            </div>
          );
        })}
      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Meus Jobs Recentes</h2>
        <div className="rounded-xl border border-border bg-card shadow-card">
          {jobs.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Nenhum job ainda.</div>
          ) : jobs.map((j) => (
            <div key={j.id} className="flex items-center justify-between border-b border-border p-4 last:border-b-0">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{jobTypeLabel[j.type]}</p>
                <p className="mt-1 text-xs text-muted-foreground">{fmtRelative(j.created_at)}</p>
                {j.status === "error" && j.error_message && (
                  <p className="mt-1 text-xs [color:hsl(var(--destructive))]">{j.error_message}</p>
                )}
                {(j.status === "pending" || j.status === "processing") && (
                  <Progress value={j.status === "processing" ? 60 : 20} className="mt-2 h-1 w-40" />
                )}
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={j.status} label={jobStatusLabel[j.status]} />
                {j.status === "done" && j.output_file_path && (
                  <Button size="sm" variant="outline" onClick={() => downloadOutput(j.output_file_path)}>
                    <Download className="mr-1 h-3.5 w-3.5" /> Baixar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Sheet open={!!openTool} onOpenChange={(v) => !v && setOpenTool(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {tool && (
            <>
              <SheetHeader>
                <SheetTitle>{tool.title}</SheetTitle>
                <SheetDescription>{tool.description}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div>
                  <Label>Banca</Label>
                  <Select value={form.banca} onValueChange={(v) => setForm({ ...form, banca: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BANCAS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Nome do professor</Label>
                  <Input value={profileName} onChange={(e) => setProfileName(e.target.value)} />
                </div>
                {tool.type !== "revisar_docx" && (
                  <div>
                    <Label>Tipo de entrada</Label>
                    <RadioGroup value={form.inputMode} onValueChange={(v: any) => setForm({ ...form, inputMode: v })}
                      className="mt-2 flex gap-4">
                      <div className="flex items-center gap-2"><RadioGroupItem value="file" id="m-file" /><Label htmlFor="m-file" className="cursor-pointer">Upload</Label></div>
                      <div className="flex items-center gap-2"><RadioGroupItem value="text" id="m-text" /><Label htmlFor="m-text" className="cursor-pointer">Colar texto</Label></div>
                    </RadioGroup>
                  </div>
                )}
                {(form.inputMode === "file" || tool.type === "revisar_docx") ? (
                  <div>
                    <Label>Arquivo ({tool.accept})</Label>
                    <Input type="file" accept={tool.accept} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                  </div>
                ) : (
                  <div>
                    <Label>Conteúdo</Label>
                    <Textarea rows={8} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
                  </div>
                )}
                <Button className="w-full" onClick={submit} disabled={submitting}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {tool.type === "gerar_pptx" ? "Gerar Slides" : tool.type === "formatar_questoes" ? "Formatar Questões" : "Revisar Material"}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
