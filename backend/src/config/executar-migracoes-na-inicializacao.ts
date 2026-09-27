import { Injectable, type OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { executarMigracoes } from './migracoes.js';

// Deixa o banco atualizado antes de o backend aceitar requisições — no
// Docker local, nos testes e em cada instância da função na Vercel.
@Injectable()
export class ExecutarMigracoesNaInicializacao implements OnModuleInit {
  constructor(private readonly dataSource: DataSource) {}

  onModuleInit(): Promise<void> {
    return executarMigracoes(this.dataSource);
  }
}
