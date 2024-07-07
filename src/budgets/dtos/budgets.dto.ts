import { IsBoolean, IsDate, IsNumber, IsString } from 'class-validator';

export class CreateBudgetsDto {
  @IsString()
  readonly name: string;

  @IsString()
  readonly description: string;

  @IsDate()
  readonly startDate: Date;

  @IsDate()
  readonly endDate: Date;

  @IsNumber()
  readonly currentAmount: number;

  @IsNumber()
  readonly limit: number;

  @IsString()
  readonly period: string;

  @IsBoolean()
  readonly isActive: boolean;

  @IsDate()
  readonly nextResetDate: Date;
}
