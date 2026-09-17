import type { DiaSemana } from './dia-semana.ts';

export interface Alocacao {
  id: string;
  atividade: { id: string; nome: string; cor: string };
  diaSemana: DiaSemana;
  horaInicio: string; // "HH:mm"
  duracaoMinutos: number;
}
