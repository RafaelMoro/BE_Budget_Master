import { IsMongoId, IsNotEmpty, IsBoolean, IsArray } from 'class-validator';
import { CreateRecordDto } from '../records/dtos/records.dto';
import { PartialType } from '@nestjs/swagger';
import { Budget } from '../budgets/budgets.entity';

export class CreateExpenseDto extends CreateRecordDto {
  @IsBoolean()
  readonly isPaid: boolean;

  @IsArray()
  readonly linkedBudgets: Budget[];
}

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {
  @IsMongoId()
  @IsNotEmpty()
  readonly recordId: string;

  @IsMongoId()
  readonly userId: string;
}

export class DeleteExpenseDto {
  @IsMongoId()
  @IsNotEmpty()
  readonly recordId: string;
}
