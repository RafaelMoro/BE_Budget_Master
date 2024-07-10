import { Expense } from '../expenses/expenses.entity';
import { DeleteRecordDto } from './dtos/records.dto';
import { GeneralResponse } from '../response.interface';
import { Income } from '../incomes/incomes.entity';
import { CreateIncomeDto, UpdateIncomeDto } from '../incomes/incomes.dto';
import { CreateExpenseDto, UpdateExpenseDto } from '../expenses/expenses.dto';

/** Interfaces of services */
export interface FindRecordsByAccountProps {
  accountId: string;
  userId: string;
  isIncome?: boolean;
}

export interface UpdateRecordProps {
  changes: UpdateIncomeDto | UpdateExpenseDto;
  isIncome?: boolean;
  userId: string;
  skipFindCategory?: boolean;
  skipUpdateExpensesPaid?: boolean;
}

export interface CreateTransferProps {
  expense: CreateExpenseDto;
  income: CreateIncomeDto;
  userId: string;
}

export interface FindTransferRecordsByMonthAndYearProps {
  month: string;
  year: string;
  userId: string;
  transferId: string;
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

export interface FindTransferRecordsResponse
  extends Omit<GeneralResponse, 'data'> {
  data: {
    expense: Expense;
    income: Income;
  };
}

export interface UpdateRecordResponse extends Omit<GeneralResponse, 'data'> {
  data: {
    record: Expense | Income;
  };
}

export interface MultipleRecordsResponse extends Omit<GeneralResponse, 'data'> {
  data: {
    records: Expense[] | Income[] | (Expense | Income)[] | null;
  };
}

export interface RecordCreated extends Omit<GeneralResponse, 'category'> {
  data: {
    record: Expense | Income;
  };
}

export interface TransferCreated extends Omit<GeneralResponse, 'category'> {
  data: {
    expense: Expense;
    income: Income;
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
