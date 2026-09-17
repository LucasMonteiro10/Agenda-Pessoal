import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AtividadesController } from './atividades.controller.js';
import { AtividadesService } from './atividades.service.js';
import { Atividade } from './entities/atividade.entity.js';

@Module({
  // PassportModule precisa ser importado (com .register()) em todo módulo
  // que usa JwtAuthGuard (AuthGuard('jwt')) — não basta importar só no
  // AuthModule, porque cada módulo tem seu próprio container de DI.
  imports: [TypeOrmModule.forFeature([Atividade]), PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [AtividadesController],
  providers: [AtividadesService],
})
export class AtividadesModule {}
