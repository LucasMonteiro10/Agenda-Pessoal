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
import { UsuarioAtual } from '../auth/usuario-atual.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { UsuarioAutenticado } from '../auth/jwt.strategy.js';
import { AtividadesService } from './atividades.service.js';
import { AtualizarAtividadeDto } from './dto/atualizar-atividade.dto.js';
import { CriarAtividadeDto } from './dto/criar-atividade.dto.js';

@Controller('atividades')
@UseGuards(JwtAuthGuard)
export class AtividadesController {
  constructor(private readonly atividadesService: AtividadesService) {}

  @Post()
  criar(@UsuarioAtual() usuario: UsuarioAutenticado, @Body() dto: CriarAtividadeDto) {
    return this.atividadesService.criar(usuario.id, dto);
  }

  @Get()
  listar(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.atividadesService.listar(usuario.id);
  }

  @Patch(':id')
  atualizar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id') id: string,
    @Body() dto: AtualizarAtividadeDto,
  ) {
    return this.atividadesService.atualizar(usuario.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remover(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id') id: string) {
    return this.atividadesService.remover(usuario.id, id);
  }
}
