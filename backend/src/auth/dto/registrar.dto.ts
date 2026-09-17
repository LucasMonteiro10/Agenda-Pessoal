import { IsEmail, MinLength } from 'class-validator';

export class RegistrarDto {
  @IsEmail()
  email!: string;

  @MinLength(8)
  senha!: string;
}
