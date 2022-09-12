import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

import { AuthService } from '../services/auth.service';
import { LOCAL_STRATEGY } from '../constants';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, LOCAL_STRATEGY) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string) {
    const validUser = await this.authService.validatePasswordOfUser(
      email,
      password,
    );
    if (!validUser)
      throw new UnauthorizedException('Email or Password incorrect.');
    return validUser;
  }
}
