import { IsString, IsNotEmpty, IsArray, IsMongoId } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class CreateCategoriesDto {
  @IsString()
  @IsNotEmpty()
  readonly categoryName: string;

  @IsArray()
  @IsNotEmpty()
  readonly subCategories: string[];

  @IsString()
  @IsNotEmpty()
  readonly icon: string;
}

export class UpdateCategoriesDto extends PartialType(CreateCategoriesDto) {
  @IsMongoId()
  @IsNotEmpty()
  readonly categoryId: Types.ObjectId;
}

export class DeleteCategoryDto {
  @IsMongoId()
  @IsNotEmpty()
  readonly categoryId: string;
}
