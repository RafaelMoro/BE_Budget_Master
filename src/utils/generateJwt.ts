import { JwtService } from '@nestjs/jwt';

import { User } from '../users/entities/users.entity';
import { PayloadToken } from '../interfaces';

export const generateJWT = (user: User, jwtService: JwtService) => {
  const payload: PayloadToken = { sub: user.id };
  return jwtService.sign(payload);
};
