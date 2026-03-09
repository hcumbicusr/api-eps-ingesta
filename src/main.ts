import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { winstonConfig } from './utils/logger.config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: winstonConfig, // Usamos la configuración de Winston para el logger global
  });
  const port = process.env.INGESTA_PORT || process.env.PORT || 5000;
  await app.listen(port, '0.0.0.0');

  Logger.log(
    `API Ingesta EPS inicializada en el puerto ${port} -  ${await app.getUrl()}`,
    'Bootstrap',
  );
}
bootstrap();
