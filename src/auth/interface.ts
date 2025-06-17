import { User } from '../users/entities/users.entity';
import { GeneralResponse } from '../response.interface';

export interface LoginResponse extends Omit<GeneralResponse, 'data'> {
  data: {
    user: User;
  };
}
