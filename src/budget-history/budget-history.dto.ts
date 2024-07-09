import {
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
import { Budget } from '../budgets/budgets.entity';
import { Types } from 'mongoose';

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
  readonly recordAmount: string;

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
  readonly budget: Budget | Types.ObjectId;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecordsHistory)
  readonly records: RecordsHistory[];
}

export class UpdateBudgetHistoryDto extends PartialType(
  CreateBudgetHistoryDto,
) {
  @IsMongoId()
  @IsNotEmpty()
  readonly budgetHistoryId: Types.ObjectId;
}

export class DeleteBudgetHistoryDto {
  @IsMongoId()
  @IsNotEmpty()
  readonly budgetHistoryId: string;
}

export class AddRecordToBudgetHistoryDto {
  @IsMongoId()
  @IsNotEmpty()
  readonly budgetHistoryId: Types.ObjectId;

  @ValidateNested({ each: true })
  @Type(() => RecordsHistory)
  readonly record: RecordsHistory;
}
