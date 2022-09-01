import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(private configService: ConfigService) {}

  findAll() {
    const envVariable = this.configService.get('TEST');
    console.log(envVariable);
    return 'hello';
  }
}
