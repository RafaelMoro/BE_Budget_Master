import { IsNotEmpty } from 'class-validator';
import { CreateExpenseDto } from './expenses.dto';
import { CreateIncomeDto } from './incomes.dto';

export class CreateTransferDto {
  @IsNotEmpty()
  readonly expense: CreateExpenseDto;

  @IsNotEmpty()
  readonly income: CreateIncomeDto;
}
