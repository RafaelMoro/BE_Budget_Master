import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
dotenv.config();

const frontendUri = process.env.FRONTEND_URI;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: frontendUri,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  await app.listen(6006);
}
bootstrap();
