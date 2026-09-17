import { IsEnum, IsInt, IsOptional, Matches, Min } from 'class-validator';
import { DiaSemana } from '../dia-semana.enum.js';

export class AtualizarAlocacaoDto {
  @IsOptional()
  @IsEnum(DiaSemana)
  diaSemana?: DiaSemana;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'horaInicio deve estar no formato HH:mm' })
  horaInicio?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  duracaoMinutos?: number;
}
