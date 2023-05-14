import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsArray,
  IsMongoId,
  IsDate,
  ValidateNested,
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

export class CreateRecordDto {
  @IsString()
  @IsNotEmpty()
  readonly shortName: string;

  @IsString()
  readonly description: string;

  @IsNumber()
  @IsNotEmpty()
  readonly amount: number;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  readonly date: Date;

  @IsString()
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

export class DeleteRecordDto {
  @IsMongoId()
  @IsNotEmpty()
  readonly recordId: string;
}
