import { JwtService } from '@nestjs/jwt';

import { User } from '../users/entities/users.entity';
import { PayloadToken } from '../interfaces';

export const generateJWT = (user: User, jwtService: JwtService) => {
  const mongoId = user._id;
  const mongoIdString = mongoId.toString();
  const payload: PayloadToken = { sub: mongoIdString };
  return jwtService.sign(payload);
};
