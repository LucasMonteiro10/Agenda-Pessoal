import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { UsuarioAutenticado } from '../auth/jwt.strategy.js';
import { UsuarioAtual } from '../auth/usuario-atual.decorator.js';
import { AlocacoesService } from './alocacoes.service.js';
import { AtualizarAlocacaoDto } from './dto/atualizar-alocacao.dto.js';
import { CriarAlocacaoDto } from './dto/criar-alocacao.dto.js';

@Controller('alocacoes')
@UseGuards(JwtAuthGuard)
export class AlocacoesController {
  constructor(private readonly alocacoesService: AlocacoesService) {}

  @Post()
  criar(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() dto: CriarAlocacaoDto) {
    return this.alocacoesService.criar(usuario.id, dto);
  }

  @Get()
  listar(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.alocacoesService.listar(usuario.id);
  }

  @Get(':id')
  buscarUma(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.alocacoesService.buscarUma(usuario.id, id);
  }

  @Patch(':id')
  atualizar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id') id: string,
    @Body() dto: AtualizarAlocacaoDto,
  ) {
    return this.alocacoesService.atualizar(usuario.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remover(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.alocacoesService.remover(usuario.id, id);
  }

  // Feature "Limpar calendário".
  @Delete()
  @HttpCode(204)
  removerTodas(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.alocacoesService.removerTodas(usuario.id);
  }
}
