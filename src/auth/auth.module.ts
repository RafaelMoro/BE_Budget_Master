import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { ControllersController } from './controllers/controllers.controller';

@Module({
  providers: [AuthService],
  controllers: [ControllersController],
})
export class AuthModule {}
