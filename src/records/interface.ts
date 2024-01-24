import { Expense } from './entities/expenses.entity';
import { DeleteRecordDto } from './dtos/records.dto';
import { GeneralResponse } from 'src/response.interface';
import { Income } from './entities/incomes.entity';

/** Interfaces of services */
export interface FindRecordsByAccountProps {
  accountId: string;
  userId: string;
  isIncome?: boolean;
}

export interface RemoveRecordProps {
  payload: DeleteRecordDto;
  userId: string;
  isIncome?: boolean;
}

export interface SingleRecordResponse extends Omit<GeneralResponse, 'data'> {
  data: {
    record: Expense | Income;
  };
}

export interface MultipleRecordsResponse extends Omit<GeneralResponse, 'data'> {
  data: {
    records: Expense[] | Income[] | null;
  };
}

export interface RecordCreated extends Omit<GeneralResponse, 'category'> {
  data: {
    record: Expense | Income;
  };
}

export interface JoinRecordsResponse extends Omit<GeneralResponse, 'data'> {
  data: {
    records: (Expense | Income)[];
  };
}

export interface BatchRecordsResponse extends Omit<GeneralResponse, 'data'> {
  data: (Expense | Income | string)[];
}
