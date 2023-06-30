import { IsString, IsNotEmpty, IsArray, IsMongoId } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateCategoriesDto {
  @IsString()
  @IsNotEmpty()
  readonly categoryName: string;

  @IsArray()
  @IsNotEmpty()
  readonly subCategories: string[];
}

export class UpdateCategoriesDto extends PartialType(CreateCategoriesDto) {
  @IsMongoId()
  @IsNotEmpty()
  readonly categoryId: string;
}

export class DeleteCategoryDto {
  @IsMongoId()
  @IsNotEmpty()
  readonly categoryId: string;
}
