import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { origemPermitida, portaDoServidor } from './config/servidor.config.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    // Sem cabeçalho Origin (curl, chamadas entre servidores), CORS não se
    // aplica — só navegadores enviam Origin.
    origin: (origem: string | undefined, responder: (erro: Error | null, permitida?: boolean) => void) =>
      responder(null, !origem || origemPermitida(origem, process.env)),
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(portaDoServidor(process.env));
}
await bootstrap();
