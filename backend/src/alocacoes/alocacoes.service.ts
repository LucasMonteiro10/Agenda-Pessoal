import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Atividade } from '../atividades/entities/atividade.entity.js';
import { AtualizarAlocacaoDto } from './dto/atualizar-alocacao.dto.js';
import { CriarAlocacaoDto } from './dto/criar-alocacao.dto.js';
import { Alocacao } from './entities/alocacao.entity.js';

// Formato de resposta da API: nome/cor da atividade sempre embutidos (join),
// nunca duplicados nas colunas da própria Alocação — ver comentário na
// entidade Alocacao.
function paraResposta(alocacao: Alocacao) {
  return {
    id: alocacao.id,
    atividadeId: alocacao.atividadeId,
    diaSemana: alocacao.diaSemana,
    horaInicio: alocacao.horaInicio,
    duracaoMinutos: alocacao.duracaoMinutos,
    atividade: {
      id: alocacao.atividade.id,
      nome: alocacao.atividade.nome,
      cor: alocacao.atividade.cor,
    },
  };
}

@Injectable()
export class AlocacoesService {
  constructor(
    @InjectRepository(Alocacao) private readonly alocacoes: Repository<Alocacao>,
    @InjectRepository(Atividade) private readonly atividades: Repository<Atividade>,
  ) {}

  async criar(usuarioId: string, dto: CriarAlocacaoDto) {
    // Não há validação de conflito de horário: sobreposição é permitida
    // (Suposições e decisões de negócio, item 6) — a resolução visual fica
    // inteiramente a cargo do frontend.
    const atividade = await this.atividades.findOne({ where: { id: dto.atividadeId, usuarioId } });
    if (!atividade) {
      throw new NotFoundException('Atividade não encontrada');
    }

    const alocacao = await this.alocacoes.save(this.alocacoes.create(dto));
    alocacao.atividade = atividade;
    return paraResposta(alocacao);
  }

  async listar(usuarioId: string) {
    const alocacoes = await this.alocacoes
      .createQueryBuilder('alocacao')
      .innerJoinAndSelect('alocacao.atividade', 'atividade')
      .where('atividade.usuarioId = :usuarioId', { usuarioId })
      .getMany();

    return alocacoes.map(paraResposta);
  }

  async buscarUma(usuarioId: string, id: string) {
    const alocacao = await this.buscarDoUsuarioOuFalhar(usuarioId, id);
    return paraResposta(alocacao);
  }

  async atualizar(usuarioId: string, id: string, dto: AtualizarAlocacaoDto) {
    const alocacao = await this.buscarDoUsuarioOuFalhar(usuarioId, id);
    Object.assign(alocacao, dto);
    const salva = await this.alocacoes.save(alocacao);
    salva.atividade = alocacao.atividade;
    return paraResposta(salva);
  }

  async remover(usuarioId: string, id: string): Promise<void> {
    await this.buscarDoUsuarioOuFalhar(usuarioId, id);
    await this.alocacoes.delete(id);
  }

  // Feature "Limpar calendário": remove todas as alocações do usuário,
  // preservando as atividades na pool.
  async removerTodas(usuarioId: string): Promise<void> {
    await this.alocacoes
      .createQueryBuilder()
      .delete()
      .where('"atividadeId" IN (SELECT id FROM atividades WHERE "usuarioId" = :usuarioId)', { usuarioId })
      .execute();
  }

  private async buscarDoUsuarioOuFalhar(usuarioId: string, id: string): Promise<Alocacao> {
    const alocacao = await this.alocacoes
      .createQueryBuilder('alocacao')
      .innerJoinAndSelect('alocacao.atividade', 'atividade')
      .where('alocacao.id = :id', { id })
      .andWhere('atividade.usuarioId = :usuarioId', { usuarioId })
      .getOne();

    if (!alocacao) {
      throw new NotFoundException('Alocação não encontrada');
    }
    return alocacao;
  }
}
