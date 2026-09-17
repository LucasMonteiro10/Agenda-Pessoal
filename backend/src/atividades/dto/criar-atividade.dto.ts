import { IsHexColor, IsString, MinLength } from 'class-validator';

export class CriarAtividadeDto {
  @IsString()
  @MinLength(1)
  nome!: string;

  @IsHexColor()
  cor!: string;
}
