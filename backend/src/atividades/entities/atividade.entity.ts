import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

// Nome único por usuário (Suposições e decisões de negócio, item 5, em
// docs/requisitos.md) — não único globalmente, já que cada usuário tem sua
// própria pool isolada.
@Entity('atividades')
@Unique(['usuarioId', 'nome'])
export class Atividade {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  nome!: string;

  @Column()
  cor!: string;

  @Column()
  usuarioId!: string;
}
