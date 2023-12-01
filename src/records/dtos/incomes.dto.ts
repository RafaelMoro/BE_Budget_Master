import { IsMongoId, IsNotEmpty, IsArray } from 'class-validator';
import { CreateRecordDto } from './records.dto';
import { PartialType } from '@nestjs/swagger';
import { CreateExpense } from '../entities/expenses.entity';

export class CreateIncomeDto extends CreateRecordDto {
  @IsArray()
  readonly expensesPaid: CreateExpense[];
}

export class UpdateIncomeDto extends PartialType(CreateIncomeDto) {
  @IsMongoId()
  @IsNotEmpty()
  readonly recordId: string;
}
