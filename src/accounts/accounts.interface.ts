import { Types } from 'mongoose';
import { GeneralResponse } from '../response.interface';
import { Account } from './entities/accounts.entity';

export interface AccountResponse extends Account {
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
