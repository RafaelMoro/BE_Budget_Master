import { IsString, IsNotEmpty, IsArray } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateCategoriesDto {
  @IsString()
  @IsNotEmpty()
  readonly categoryName: string;

  @IsArray()
  @IsNotEmpty()
  readonly subCategories: string[];
}

export class UpdateCategoriesDto extends PartialType(CreateCategoriesDto) {}
