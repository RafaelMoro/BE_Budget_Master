import { Types } from 'mongoose';
import { GeneralResponse } from 'src/response.interface';
import { User } from './entities/users.entity';

export interface UserResponse extends User {
  _id: Types.ObjectId;
}

interface CreateUserResponseData {
  email: string;
}

export interface CreateUserResponse extends Omit<GeneralResponse, 'data'> {
  data: CreateUserResponseData;
}
