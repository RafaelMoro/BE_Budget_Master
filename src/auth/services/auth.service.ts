import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import config from '../../config';

@Injectable()
export class AuthService {
  constructor(
    @Inject(config.KEY) private configService: ConfigType<typeof config>,
  ) {}

  findAll() {
    const envVariable = this.configService.test;
    console.log(envVariable);
    return 'hello';
  }
}
