import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Category } from '../entities/categories.entity';
import { Model } from 'mongoose';
import {
  CreateCategoriesDto,
  DeleteCategoryDto,
  UpdateCategoriesDto,
} from '../dtos/categories.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  async findbyUser(sub: string) {
    try {
      const categories = await this.categoryModel
        .find({ sub }, { sub: 0 })
        .exec();
      return categories;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createOne(payload: CreateCategoriesDto, userId: string) {
    try {
      const completeData = { ...payload, sub: userId };
      const newModel = new this.categoryModel(completeData);
      const model = await newModel.save();
      return model;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateCategory(changes: UpdateCategoriesDto) {
    try {
      const { categoryId } = changes;
      const updateCategory = await this.categoryModel
        .findByIdAndUpdate(categoryId, { $set: changes }, { new: true })
        .exec();
      if (!updateCategory) throw new BadRequestException('Category not found');
      return updateCategory;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async removeCategory(payload: DeleteCategoryDto) {
    try {
      const { categoryId } = payload;
      const categoryDeleted = await this.categoryModel.findByIdAndDelete(
        categoryId,
      );
      if (!categoryDeleted) throw new BadRequestException('Category not found');
      return categoryDeleted;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
