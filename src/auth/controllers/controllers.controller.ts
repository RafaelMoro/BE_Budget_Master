import { Controller, Get } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

@Controller('auth')
export class ControllersController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  getHello() {
    return this.authService.findAll();
  }
}
