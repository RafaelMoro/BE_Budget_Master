import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from '../services/auth.service';

import { LOCAL_STRATEGY } from '../constants';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard(LOCAL_STRATEGY))
  @Post()
  login(@Req() request: Request) {
    return request.user;
  }
}
