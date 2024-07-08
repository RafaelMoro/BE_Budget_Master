import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDate,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';
import { Budget } from '../budgets/entities/budgets.entity';

export class RecordsHistory {
  @IsString()
  @IsNotEmpty()
  readonly recordId: string;

  @IsString()
  @IsNotEmpty()
  readonly recordName: string;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  readonly recordDate: Date;

  @IsNumber()
  @IsNotEmpty()
  readonly budgetCurrentAmount: number;

  @IsNumber()
  @IsNotEmpty()
  readonly budgetUpdatedAmount: number;
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
  @ValidateNested({ each: true })
  @ArrayMinSize(5)
  @ArrayMaxSize(5)
  @Type(() => RecordsHistory)
  readonly records: RecordsHistory[];
}

export class UpdateBudgetHistory extends PartialType(CreateBudgetHistoryDto) {}

export class DeleteBudgetHistoryDto {
  @IsMongoId()
  @IsNotEmpty()
  readonly budgetHistoryId: string;
}
