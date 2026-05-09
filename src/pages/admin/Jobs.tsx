import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";
import { fmtDateTime, jobStatusLabel, jobTypeLabel } from "@/lib/format";
import { toast } from "sonner";

export default function AdminJobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [filters, setFilters] = useState({ type: "all", status: "all" });

  const load = async () => {
    const { data } = await supabase.from("jobs")
      .select("*, profiles:created_by(name,email)").order("created_at", { ascending: false });
    setJobs(data ?? []);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel("admin-jobs")
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const download = async (path: string) => {
    const { data, error } = await supabase.storage.from("job-files").createSignedUrl(path, 60);
    if (error || !data) return toast.error("Erro");
    window.open(data.signedUrl, "_blank");
  };

  const filtered = jobs.filter((j) =>
    (filters.type === "all" || j.type === filters.type) &&
    (filters.status === "all" || j.status === filters.status));

  return (
    <>
      <PageHeader title="Ferramentas / Jobs" description="Acompanhe execuções de automações." />
      <div className="mb-4 flex gap-3">
        <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todos os tipos</SelectItem>{Object.entries(jobTypeLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">Todos os status</SelectItem>{Object.entries(jobStatusLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr><th className="p-3 text-left">Professor</th><th className="p-3 text-left">Tipo</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Criado</th><th className="p-3 text-left">Concluído</th><th className="p-3 text-right">Ações</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Sem jobs.</td></tr> :
              filtered.map((j) => (
                <tr key={j.id} className="border-t border-border">
                  <td className="p-3">{j.profiles?.name ?? j.profiles?.email}</td>
                  <td className="p-3">{jobTypeLabel[j.type]}</td>
                  <td className="p-3">
                    <StatusBadge status={j.status} label={jobStatusLabel[j.status]} />
                    {j.status === "error" && j.error_message && <p className="mt-1 text-xs [color:hsl(var(--destructive))]">{j.error_message}</p>}
                  </td>
                  <td className="p-3 text-muted-foreground">{fmtDateTime(j.created_at)}</td>
                  <td className="p-3 text-muted-foreground">{j.finished_at ? fmtDateTime(j.finished_at) : "—"}</td>
                  <td className="p-3 text-right">
                    {j.status === "done" && j.output_file_path && (
                      <Button size="sm" variant="outline" onClick={() => download(j.output_file_path)}>
                        <Download className="mr-1 h-3.5 w-3.5" /> Baixar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
