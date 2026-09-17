// Espelha o enum DiaSemana do backend (backend/src/alocacoes/dia-semana.enum.ts).
export type DiaSemana =
  | 'domingo'
  | 'segunda-feira'
  | 'terca-feira'
  | 'quarta-feira'
  | 'quinta-feira'
  | 'sexta-feira'
  | 'sabado';

export const NOME_EXIBICAO_DIA_SEMANA: Record<DiaSemana, string> = {
  domingo: 'Domingo',
  'segunda-feira': 'Segunda-feira',
  'terca-feira': 'Terça-feira',
  'quarta-feira': 'Quarta-feira',
  'quinta-feira': 'Quinta-feira',
  'sexta-feira': 'Sexta-feira',
  sabado: 'Sábado',
};

// FullCalendar representa dia da semana como número (0 = domingo ... 6 =
// sábado, padrão JS `Date.getDay()`). A ordenação visual das colunas
// (Cenários "Escolher X como o dia de início da semana") passa a ser
// responsabilidade da prop `firstDay` do FullCalendar, não mais nossa.
const DIAS_SEMANA_EM_ORDEM: DiaSemana[] = [
  'domingo',
  'segunda-feira',
  'terca-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sabado',
];

export function paraNumeroDiaSemana(dia: DiaSemana): number {
  return DIAS_SEMANA_EM_ORDEM.indexOf(dia);
}

export function paraDiaSemana(numero: number): DiaSemana {
  return DIAS_SEMANA_EM_ORDEM[numero];
}
