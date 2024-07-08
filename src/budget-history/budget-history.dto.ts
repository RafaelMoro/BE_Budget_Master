import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';
import { CreateExpense } from '../records/entities/expenses.entity';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';
import { Budget } from '../budgets/entities/budgets.entity';

export class RecordsHistory {
  @IsString()
  @IsNotEmpty()
  recordId: CreateExpense;

  @IsNumber()
  @IsNotEmpty()
  budgetCurrentAmount: number;

  @IsNumber()
  @IsNotEmpty()
  budgetUpdatedAmount: number;
}

export class CreateBudgetHistoryDto {
  @IsNotEmpty()
  @IsString()
  readonly budgetId: Budget;

  @IsNotEmpty()
  @IsString()
  readonly userId: string;

  @IsNotEmpty()
  @IsString()
  readonly budgetName: string;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  readonly startDate: Date;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  readonly endDate: Date;

  @IsArray()
  readonly records: RecordsHistory[];
}

export class UpdateBudgetHistory extends PartialType(CreateBudgetHistoryDto) {}
