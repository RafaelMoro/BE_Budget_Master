import { User } from '../users/entities/users.entity';
import { GeneralResponse } from '../response.interface';

export interface LoginData {
  accessToken: string;
  user: User;
}

export interface LoginResponse extends Omit<GeneralResponse, 'data'> {
  data: LoginData;
}
