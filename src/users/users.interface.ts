import { GeneralResponse } from 'src/response.interface';
import { User } from './entities/users.entity';

export interface UserResponse extends User {
  _id: unknown;
}

interface CreateUserResponseData {
  userCreated: {
    email: string;
    sub: string;
  };
}

export interface CreateUserResponse extends Omit<GeneralResponse, 'data'> {
  data: CreateUserResponseData;
}

export interface GeneralUserResponse extends Omit<GeneralResponse, 'data'> {
  data: {
    user: UserResponse;
  };
}

export interface UpdateProfileData {
  email: string;
  firstName: string;
  lastName: string;
  middleName: string;
}

export interface UpdateProfileResponse extends Omit<GeneralResponse, 'data'> {
  data: {
    userUpdated: UpdateProfileData;
  };
}

export interface ForgotResetPasswordResponse
  extends Omit<GeneralResponse, 'data'> {
  data: null;
}
