import { IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateExpenseDto } from './expenses.dto';
import { CreateIncomeDto } from './incomes.dto';

export class CreateTransferDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateExpenseDto)
  readonly expense: CreateExpenseDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateIncomeDto)
  readonly income: CreateIncomeDto;
}
