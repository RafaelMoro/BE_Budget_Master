import { IsMongoId, IsNotEmpty, IsBoolean } from 'class-validator';
import { CreateRecordDto } from './records.dto';
import { PartialType } from '@nestjs/swagger';

export class CreateIncomeDto extends CreateRecordDto {
  @IsBoolean()
  @IsNotEmpty()
  readonly amountPayed: boolean;
}

export class UpdateIncomeDto extends PartialType(CreateIncomeDto) {
  @IsMongoId()
  @IsNotEmpty()
  readonly recordId: string;
}
