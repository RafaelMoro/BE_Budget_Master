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

interface DeleteAccountResponseData {
  accountDeleted: AccountResponse;
  numberExpensesDeleted: number;
  numberIncomesDeleted: number;
}

export interface DeleteAccountResponse extends Omit<GeneralResponse, 'data'> {
  data: DeleteAccountResponseData;
}
