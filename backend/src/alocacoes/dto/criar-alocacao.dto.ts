import { IsEnum, IsInt, IsUUID, Matches, Min } from 'class-validator';
import { DiaSemana } from '../dia-semana.enum.js';

export class CriarAlocacaoDto {
  @IsUUID()
  atividadeId!: string;

  @IsEnum(DiaSemana)
  diaSemana!: DiaSemana;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'horaInicio deve estar no formato HH:mm' })
  horaInicio!: string;

  // Sem limite superior de propósito: granularidade é só visual, duração é
  // livre (Suposições e decisões de negócio, item 2, em docs/requisitos.md).
  @IsInt()
  @Min(1)
  duracaoMinutos!: number;
}
