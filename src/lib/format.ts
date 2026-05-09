import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const fmtDate = (d?: string | Date | null) =>
  d ? format(new Date(d), "dd MMM yyyy", { locale: ptBR }) : "—";

export const fmtDateTime = (d?: string | Date | null) =>
  d ? format(new Date(d), "dd MMM yyyy 'às' HH:mm", { locale: ptBR }) : "—";

export const fmtRelative = (d?: string | Date | null) =>
  d ? formatDistanceToNow(new Date(d), { addSuffix: true, locale: ptBR }) : "—";

export const requestTypeLabel: Record<string, string> = {
  formatacao_questoes: "Formatação de Questões",
  gerar_slides: "Gerar Slides",
  revisao_material: "Revisão de Material",
  outro: "Outro",
};

export const requestStatusLabel: Record<string, string> = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export const scheduleStatusLabel: Record<string, string> = {
  pendente_aprovacao: "Pendente de aprovação",
  aprovado: "Aprovado",
  entregue: "Entregue",
  atrasado: "Atrasado",
  cancelado: "Cancelado",
};

export const jobTypeLabel: Record<string, string> = {
  gerar_pptx: "Gerador de Slides",
  formatar_questoes: "Formatação de Questões",
  revisar_docx: "Revisão de Material",
};

export const jobStatusLabel: Record<string, string> = {
  pending: "Aguardando",
  processing: "Processando",
  done: "Concluído",
  error: "Erro",
};

export const solicitacaoTypeLabel: Record<string, string> = {
  revisao_formato: "Revisão de Formato",
  gerar_slides: "Geração de Slides",
  selecao_questoes: "Seleção de Questões",
  atualizar_questoes_bo: "Atualização de Questões no BO",
  outro: "Outro",
  // legados
  material: "Material",
  slide: "Slides",
  revisao: "Revisão",
};

export const solicitacaoStatusLabel: Record<string, string> = {
  aberta: "Aberta",
  em_triagem: "Em triagem",
  aprovada: "Aprovada",
  convertida: "Convertida em entrega",
  rejeitada: "Rejeitada",
  cancelada: "Cancelada",
};

export const deliveryStatusLabel: Record<string, string> = {
  pendente: "Pendente",
  em_producao: "Em produção",
  em_revisao: "Em revisão",
  entregue: "Entregue",
  cancelada: "Cancelada",
};

export const triageStatusLabel: Record<string, string> = {
  pendente: "Pendente",
  em_analise: "Em análise",
  analise_interesse: "Em análise",
  lancado: "Lançado",
  restringido: "Restringido",
  redirecionado: "Redirecionado",
  aprovada: "Aprovada",
  rejeitada: "Rejeitada",
};

export const stepStatusLabel: Record<string, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  bloqueada: "Bloqueada",
};

export const financialStatusLabel: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  cancelado: "Cancelado",
};

export const fmtBRL = (v: number | null | undefined) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v ?? 0));
