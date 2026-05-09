// Cálculo de apuração financeira por entrega.
// IMPORTANTE: valores de placeholder — ajuste quando o cliente confirmar a tabela.

export type ApuracaoInput = {
  paginas_teoria: number;
  questoes_ineditas_ce: number;
  questoes_ineditas_mc: number;
  questoes_concurso_ce: number;
  questoes_concurso_mc: number;
  is_legislacao: boolean;
};

// Faixas de páginas (Legislação) — placeholder
const FAIXAS_LEG: { min: number; max: number; valor: number }[] = [
  { min: 0, max: 10, valor: 200 },
  { min: 11, max: 20, valor: 400 },
  { min: 21, max: 40, valor: 700 },
  { min: 41, max: 60, valor: 1000 },
  { min: 61, max: 80, valor: 1300 },
  { min: 81, max: Infinity, valor: 1500 },
];

// Por questão (Legislação) — placeholder
export const Q_VALORES_LEG = {
  inedita_ce: 8,
  inedita_mc: 12,
  concurso_ce: 4,
  concurso_mc: 6,
};

// Demais equipes: pro-rata R$1.500 (teto 80 pág + 30 questões)
const PRORATA_TETO_PAG = 80;
const PRORATA_TETO_Q = 30;
const PRORATA_VALOR = 1500;

export function calcular(input: ApuracaoInput) {
  const totalQ =
    input.questoes_ineditas_ce + input.questoes_ineditas_mc +
    input.questoes_concurso_ce + input.questoes_concurso_mc;

  if (input.is_legislacao) {
    const faixa = FAIXAS_LEG.find((f) => input.paginas_teoria >= f.min && input.paginas_teoria <= f.max);
    const valor_teoria = faixa?.valor ?? 0;
    const valor_questoes =
      input.questoes_ineditas_ce * Q_VALORES_LEG.inedita_ce +
      input.questoes_ineditas_mc * Q_VALORES_LEG.inedita_mc +
      input.questoes_concurso_ce * Q_VALORES_LEG.concurso_ce +
      input.questoes_concurso_mc * Q_VALORES_LEG.concurso_mc;
    return { valor_teoria, valor_questoes, total: valor_teoria + valor_questoes };
  }

  // Pro-rata
  const fatorPag = Math.min(1, input.paginas_teoria / PRORATA_TETO_PAG);
  const fatorQ = Math.min(1, totalQ / PRORATA_TETO_Q);
  const fator = (fatorPag + fatorQ) / 2;
  const total = Math.round(PRORATA_VALOR * fator * 100) / 100;
  // separação 70/30 (referência)
  const valor_teoria = Math.round(total * 0.7 * 100) / 100;
  const valor_questoes = Math.round((total - valor_teoria) * 100) / 100;
  return { valor_teoria, valor_questoes, total };
}
