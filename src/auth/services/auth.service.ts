import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../../users/services/users.service';
import config from '../../config';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    @Inject(config.KEY) private configService: ConfigType<typeof config>,
  ) {}

  async validatePasswordOfUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const { password, ...rta } = user.toJSON();
      return rta;
    }
    return null;
  }
}
