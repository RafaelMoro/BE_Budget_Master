import { IsMongoId, IsNotEmpty, IsBoolean } from 'class-validator';
import { CreateRecordDto } from '../records/dtos/records.dto';
import { PartialType } from '@nestjs/swagger';

export class CreateExpenseDto extends CreateRecordDto {
  @IsBoolean()
  readonly isPaid: boolean;
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
  readonly expenseId: string;
}
