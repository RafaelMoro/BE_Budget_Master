import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

export interface AccountResponse {
  _id: Types.ObjectId;
}

export interface GetAccountResponse {
  data: AccountResponse[];
  error: BadRequestException | null;
}
