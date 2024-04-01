import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { ValidationPipe } from '@nestjs/common/pipes';
import { GeneralAppExceptionFilter } from './exceptions/GeneralExceptionFilter.filter';
dotenv.config();

const frontendUri = process.env.FRONTEND_URI;
const PORT = process.env.PORT || 8080;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new GeneralAppExceptionFilter());
  app.enableCors({
    origin: [frontendUri, 'http://localhost:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  await app.listen(PORT);
}
bootstrap();
