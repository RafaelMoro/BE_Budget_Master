import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsArray,
  IsMongoId,
  ValidateNested,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';

export class IndebtedPeople {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  amount: number;

  @IsNotEmpty()
  amountPaid: number;

  @IsNotEmpty()
  isPaid: boolean;
}

export class TransferRecord {
  @IsNotEmpty()
  transferId: string;

  @IsNotEmpty()
  account: string;
}

export class CreateRecordDto {
  @IsString()
  @IsNotEmpty()
  readonly shortName: string;

  @IsString()
  @IsNotEmpty()
  readonly typeOfRecord: string;

  @IsString()
  readonly description: string;

  @IsNumber()
  @IsNotEmpty()
  readonly amount: number;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  readonly date: Date;

  @IsMongoId()
  @IsNotEmpty()
  readonly category: string;

  @IsString()
  @IsNotEmpty()
  readonly subCategory: string;

  @IsArray()
  readonly tag: string[];

  @ValidateNested()
  @Type(() => IndebtedPeople)
  readonly indebtedPeople: IndebtedPeople[];

  @ValidateNested()
  @Type(() => TransferRecord)
  readonly transferRecord: TransferRecord;

  @IsMongoId()
  @IsNotEmpty()
  readonly account: string;

  @IsArray()
  readonly budgets: string[];
}

export class UpdateRecordDto extends PartialType(CreateRecordDto) {
  @IsMongoId()
  @IsNotEmpty()
  readonly recordId: string;
}
