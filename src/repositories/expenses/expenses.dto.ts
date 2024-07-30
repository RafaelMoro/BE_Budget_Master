import { IsMongoId, IsNotEmpty, IsBoolean, IsArray } from 'class-validator';
import { CreateRecordDto } from '@domain/records/dtos/records.dto';
import { PartialType } from '@nestjs/swagger';
import { BudgetModel } from '../../budgets/budgets.entity';

export class CreateExpenseDto extends CreateRecordDto {
  @IsBoolean()
  readonly isPaid: boolean;

  @IsArray()
  readonly linkedBudgets: BudgetModel[];
}

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {
  @IsMongoId()
  @IsNotEmpty()
  readonly recordId: string;
}

export class UpdateExpensePaidStatusDto {
  @IsMongoId()
  @IsNotEmpty()
  readonly recordId: string;

  @IsBoolean()
  readonly paidStatus: boolean;
}

export class DeleteExpenseDto {
  @IsMongoId()
  @IsNotEmpty()
  readonly recordId: string;
}
