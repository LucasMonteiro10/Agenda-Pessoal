import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nomeCompleto!: string;

  @Column({ unique: true })
  email!: string;

  // Nunca expor este campo em respostas de API — ver AuthService.paraResposta().
  @Column()
  senhaHash!: string;
}
