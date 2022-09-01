import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

import { AuthService } from '../services/auth.service';
import { User } from '../../users/entities/users.entity';
import { LOCAL_STRATEGY } from '../constants';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard(LOCAL_STRATEGY))
  @Post()
  login(@Req() request: Request) {
    const user = request.user as User;
    return this.authService.generateJWT(user);
  }
}
