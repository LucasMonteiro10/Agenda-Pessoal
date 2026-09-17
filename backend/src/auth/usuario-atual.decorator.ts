import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UsuarioAutenticado } from './jwt.strategy.js';

// Uso: @UsuarioAtual() usuario: UsuarioAutenticado, em rotas protegidas por
// JwtAuthGuard — evita repetir `req.user` em cada controller.
export const UsuarioAtual = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioAutenticado => {
    const request = ctx.switchToHttp().getRequest();
    return request.user as UsuarioAutenticado;
  },
);
