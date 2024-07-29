import { Expense } from '../repositories/expenses/expenses.entity';
import { GeneralResponse } from '../response.interface';
import { Income } from '../repositories/incomes/incomes.entity';
import { CreateIncomeDto } from '../repositories/incomes/incomes.dto';
import { CreateExpenseDto } from '../repositories/expenses/expenses.dto';

/** Interfaces of services */
export interface FindRecordsByAccountProps {
  accountId: string;
  userId: string;
  isIncome?: boolean;
}

export interface CreateTransferProps {
  expense: CreateExpenseDto;
  income: CreateIncomeDto;
  userId: string;
}

export interface SingleRecordResponse extends Omit<GeneralResponse, 'data'> {
  data: {
    record: Expense | Income;
  };
}

export interface MultipleRecordsResponse extends Omit<GeneralResponse, 'data'> {
  data: {
    records: Expense[] | Income[] | (Expense | Income)[] | null;
  };
}

export interface TransferCreated
  extends Omit<GeneralResponse, 'data' | 'message'> {
  message: string[];
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
