import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Atividade } from '../../atividades/entities/atividade.entity.js';
import { DiaSemana } from '../dia-semana.enum.js';

// Decisão de modelagem (ver CLAUDE.md, seção 7.3): Alocação NÃO duplica nome
// nem cor — só referencia a Atividade. "Editar nome/cor propaga" e "editar
// dia/horário/duração NÃO propaga" saem de graça dessa modelagem.
@Entity('alocacoes')
export class Alocacao {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Atividade, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'atividadeId' })
  atividade!: Atividade;

  @Column()
  atividadeId!: string;

  @Column({ type: 'enum', enum: DiaSemana })
  diaSemana!: DiaSemana;

  // Guardado como texto "HH:mm" em vez de um tipo `time` do Postgres para
  // não precisar lidar com timezone — é só um horário de parede recorrente,
  // sem data associada (ver "Visão geral" em docs/requisitos.md).
  @Column()
  horaInicio!: string;

  // Duração livre em minutos — sem snap nem mínimo (Suposições, item 2).
  @Column()
  duracaoMinutos!: number;
}
