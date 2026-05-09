import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  aberta: "bg-warning/15 text-warning-foreground border-warning/30 [color:hsl(var(--warning))]",
  em_andamento: "bg-info/15 border-info/30 [color:hsl(var(--info))]",
  concluida: "bg-success/15 border-success/30 [color:hsl(var(--success))]",
  cancelada: "bg-muted text-muted-foreground border-border",
  pendente: "bg-warning/15 border-warning/30 [color:hsl(var(--warning))]",
  pendente_aprovacao: "bg-warning/15 border-warning/30 [color:hsl(var(--warning))]",
  aprovado: "bg-success/15 border-success/30 [color:hsl(var(--success))]",
  aprovada: "bg-success/15 border-success/30 [color:hsl(var(--success))]",
  em_triagem: "bg-info/15 border-info/30 [color:hsl(var(--info))]",
  em_analise: "bg-info/15 border-info/30 [color:hsl(var(--info))]",
  em_producao: "bg-info/15 border-info/30 [color:hsl(var(--info))]",
  em_revisao: "bg-warning/15 border-warning/30 [color:hsl(var(--warning))]",
  convertida: "bg-success/15 border-success/30 [color:hsl(var(--success))]",
  entregue: "bg-success/15 border-success/30 [color:hsl(var(--success))]",
  rejeitada: "bg-destructive/15 border-destructive/30 [color:hsl(var(--destructive))]",
  atrasado: "bg-destructive/15 border-destructive/30 [color:hsl(var(--destructive))]",
  bloqueada: "bg-destructive/15 border-destructive/30 [color:hsl(var(--destructive))]",
  cancelado: "bg-muted text-muted-foreground border-border",
  pending: "bg-warning/15 border-warning/30 [color:hsl(var(--warning))]",
  processing: "bg-info/15 border-info/30 [color:hsl(var(--info))]",
  done: "bg-success/15 border-success/30 [color:hsl(var(--success))]",
  error: "bg-destructive/15 border-destructive/30 [color:hsl(var(--destructive))]",
  active: "bg-success/15 border-success/30 [color:hsl(var(--success))]",
  paused: "bg-muted text-muted-foreground border-border",
  success: "bg-success/15 border-success/30 [color:hsl(var(--success))]",
  pago: "bg-success/15 border-success/30 [color:hsl(var(--success))]",
  analise_interesse: "bg-warning/15 border-warning/30 [color:hsl(var(--warning))]",
  lancado: "bg-success/15 border-success/30 [color:hsl(var(--success))]",
  restringido: "bg-destructive/15 border-destructive/30 [color:hsl(var(--destructive))]",
  redirecionado: "bg-info/15 border-info/30 [color:hsl(var(--info))]",
};

export function StatusBadge({ status, label, className }: { status: string; label?: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        statusStyles[status] || "bg-muted text-muted-foreground border-border",
        className,
      )}
    >
      {label ?? status.replace(/_/g, " ")}
    </span>
  );
}
