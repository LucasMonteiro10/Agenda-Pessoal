import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AtualizarAtividadeDto } from './dto/atualizar-atividade.dto.js';
import { CriarAtividadeDto } from './dto/criar-atividade.dto.js';
import { Atividade } from './entities/atividade.entity.js';

// usuarioId é um detalhe interno (usado só para filtrar por dono) — não faz
// parte do contrato de resposta da API (CLAUDE.md, seção 7.3).
function paraResposta(atividade: Atividade) {
  return { id: atividade.id, nome: atividade.nome, cor: atividade.cor };
}

@Injectable()
export class AtividadesService {
  constructor(@InjectRepository(Atividade) private readonly atividades: Repository<Atividade>) {}

  async criar(usuarioId: string, dto: CriarAtividadeDto) {
    await this.garantirNomeDisponivel(usuarioId, dto.nome);
    const atividade = await this.atividades.save(this.atividades.create({ ...dto, usuarioId }));
    return paraResposta(atividade);
  }

  async listar(usuarioId: string) {
    const atividades = await this.atividades.find({ where: { usuarioId }, order: { nome: 'ASC' } });
    return atividades.map(paraResposta);
  }

  async atualizar(usuarioId: string, id: string, dto: AtualizarAtividadeDto) {
    const atividade = await this.buscarDoUsuarioOuFalhar(usuarioId, id);

    if (dto.nome && dto.nome !== atividade.nome) {
      await this.garantirNomeDisponivel(usuarioId, dto.nome);
    }

    Object.assign(atividade, dto);
    const salva = await this.atividades.save(atividade);
    return paraResposta(salva);
  }

  async remover(usuarioId: string, id: string): Promise<void> {
    await this.buscarDoUsuarioOuFalhar(usuarioId, id);
    // A exclusão em cascata das Alocações é responsabilidade do banco
    // (onDelete: 'CASCADE' na relação em Alocacao.atividade) — evita a
    // AtividadesModule precisar conhecer o AlocacoesModule.
    await this.atividades.delete({ id, usuarioId });
  }

  private async buscarDoUsuarioOuFalhar(usuarioId: string, id: string): Promise<Atividade> {
    const atividade = await this.atividades.findOne({ where: { id, usuarioId } });
    if (!atividade) {
      throw new NotFoundException('Atividade não encontrada');
    }
    return atividade;
  }

  private async garantirNomeDisponivel(usuarioId: string, nome: string): Promise<void> {
    const existente = await this.atividades.findOne({ where: { usuarioId, nome } });
    if (existente) {
      throw new ConflictException('Já existe uma atividade com esse nome');
    }
  }
}
