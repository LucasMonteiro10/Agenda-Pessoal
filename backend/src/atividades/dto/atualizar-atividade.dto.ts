import { IsHexColor, IsOptional, IsString, MinLength } from 'class-validator';

export class AtualizarAtividadeDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  nome?: string;

  @IsOptional()
  @IsHexColor()
  cor?: string;
}
