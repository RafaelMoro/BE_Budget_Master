import { IsMongoId, IsNotEmpty, IsArray } from 'class-validator';
import { CreateRecordDto } from '../records/dtos/records.dto';
import { PartialType } from '@nestjs/swagger';
import { CreateExpense } from '../expenses/expenses.entity';

export class CreateIncomeDto extends CreateRecordDto {
  @IsArray()
  readonly expensesPaid: CreateExpense[];
}

export class UpdateIncomeDto extends PartialType(CreateIncomeDto) {
  @IsMongoId()
  @IsNotEmpty()
  readonly recordId: string;
}

export class DeleteIncomeDto {
  @IsMongoId()
  @IsNotEmpty()
  readonly recordId: string;
}
