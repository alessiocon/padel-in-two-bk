import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule/*, ObserveInstrument */} from './app.module.js';
import { getEnv } from './config/env.js';
import { loadAppSettings } from './config/appsettings.js';

async function bootstrap() {
  const env = getEnv();
  const appSettings = loadAppSettings();
  const app = await NestFactory.create(AppModule, /*{
    instrument: ObserveInstrument,
  }*/);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('PadelInTwo API')
    .setDescription('PadelInTwo backend API')
    .setVersion('1.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  if (appSettings.api?.cors?.enabled) {
    app.enableCors({
      origin: appSettings.api.cors.allowedOrigins,
      credentials: true,
    });
  }

  await app.listen(env.port);
  console.log(`PadelInTwo backend started on port ${env.port} in ${env.nodeEnv} mode`);
}

await bootstrap();
