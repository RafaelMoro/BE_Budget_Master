import { TypeOfRecord } from '../constants';

export function isTypeOfRecord(value: string): value is TypeOfRecord {
  return value === 'expense' || value === 'income' || value === 'transfer';
}
