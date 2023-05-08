import { IsMongoId, IsNotEmpty, IsArray } from 'class-validator';
import { CreateRecordDto } from './records.dto';
import { PartialType } from '@nestjs/swagger';
import { Expense } from '../entities/expenses.entity';

export class CreateIncomeDto extends CreateRecordDto {
  @IsArray()
  readonly expensesPaid: Expense[];
}

export class UpdateIncomeDto extends PartialType(CreateIncomeDto) {
  @IsMongoId()
  @IsNotEmpty()
  readonly recordId: string;
}
