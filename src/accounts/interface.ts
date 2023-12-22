import { Types } from 'mongoose';
import { GeneralResponse } from '../response.interface';

export interface AccountResponse {
  _id: Types.ObjectId;
}

export interface GeneralAccountResponse extends Omit<GeneralResponse, 'data'> {
  data: AccountResponse;
}

export interface GetAccountResponse extends Omit<GeneralResponse, 'data'> {
  data: AccountResponse[];
}
