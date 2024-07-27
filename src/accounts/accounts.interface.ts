import { Types } from 'mongoose';
import { GeneralResponse } from '../response.interface';
import { Account as AccountEntity } from './entities/accounts.entity';

export interface AccountModel extends AccountEntity {
  _id: Types.ObjectId;
}

export interface GeneralAccountResponse extends Omit<GeneralResponse, 'data'> {
  data: {
    account: AccountModel;
  };
}

export interface GetAccountResponse extends Omit<GeneralResponse, 'data'> {
  data: {
    accounts: AccountModel[];
  };
}

interface DeleteAccountResponseData {
  accountDeleted: AccountModel;
  numberExpensesDeleted: number;
  numberIncomesDeleted: number;
}

export interface DeleteAccountResponse extends Omit<GeneralResponse, 'data'> {
  data: DeleteAccountResponseData;
}
