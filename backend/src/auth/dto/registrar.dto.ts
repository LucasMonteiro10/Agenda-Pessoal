import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegistrarDto {
  @IsNotEmpty()
  nomeCompleto!: string;

  @IsEmail()
  email!: string;

  @MinLength(8)
  senha!: string;
}
