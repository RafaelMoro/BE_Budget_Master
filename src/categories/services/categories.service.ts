import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Category } from '../entities/categories.entity';
import {
  CategoriesResponse,
  GeneralCategoriesResponse,
  SingleCategoryResponse,
  UpdateSubcategoriesResponse,
} from '../interface';
import {
  CreateCategoriesDto,
  DeleteCategoryDto,
  UpdateCategoriesDto,
} from '../dtos/categories.dto';
import { VERSION_RESPONSE } from '../../constants';
import {
  CATEGORY_DELETED_MESSAGE,
  SUBCATEGORY_CREATED_SUCCESS,
  SUBCATEGORY_ERROR,
} from '../constants';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  async findbyUser(sub: string) {
    try {
      const categories: CategoriesResponse[] = await this.categoryModel
        .find({ sub }, { sub: 0 })
        .exec();
      const response: GeneralCategoriesResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: null,
        data: categories,
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findById(id: string) {
    try {
      const category: CategoriesResponse[] = await this.categoryModel
        .find({ _id: id })
        .exec();
      const response: GeneralCategoriesResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: null,
        data: category,
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findByName(categoryName: string) {
    try {
      const category: CategoriesResponse[] = await this.categoryModel
        .find({ categoryName })
        .exec();
      const response: GeneralCategoriesResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: null,
        data: category,
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createOneCategory(payload: CreateCategoriesDto, userId: string) {
    try {
      const completeData = { ...payload, sub: userId };
      const newModel = new this.categoryModel(completeData);
      const model: CategoriesResponse = await newModel.save();
      const response: SingleCategoryResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: null,
        data: model,
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateCategory(changes: UpdateCategoriesDto) {
    try {
      const { categoryId } = changes;
      const updateCategory: CategoriesResponse = await this.categoryModel
        .findByIdAndUpdate(categoryId, { $set: changes }, { new: true })
        .exec();
      if (!updateCategory) throw new BadRequestException('Category not found');
      const response: SingleCategoryResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: null,
        data: updateCategory,
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateSubcategories(
    category: CategoriesResponse,
    subCategory: string,
  ): Promise<UpdateSubcategoriesResponse> {
    try {
      // Verify that the sub category exists in the category fetched.
      const subCategoryExists = category?.subCategories.find(
        (item) => item === subCategory,
      );

      if (!subCategoryExists) {
        // If sub category does not exists, add it to the subCategories array of the category
        // And return the category id.
        const newSubCategories = [...category?.subCategories, subCategory];
        const modifyCategoryPayload: UpdateCategoriesDto = {
          categoryId: category._id,
          subCategories: newSubCategories,
        };
        const { data: categoryUpdated } = await this.updateCategory(
          modifyCategoryPayload,
        );
        const response: UpdateSubcategoriesResponse = {
          version: VERSION_RESPONSE,
          success: true,
          message: SUBCATEGORY_CREATED_SUCCESS,
          categoryId: categoryUpdated._id,
          error: null,
        };
        return response;
      }

      const response: UpdateSubcategoriesResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: SUBCATEGORY_ERROR,
        categoryId: category._id,
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async removeCategory(payload: DeleteCategoryDto) {
    try {
      const { categoryId } = payload;
      const categoryDeleted: CategoriesResponse =
        await this.categoryModel.findByIdAndDelete(categoryId);
      if (!categoryDeleted) throw new BadRequestException('Category not found');

      const response: SingleCategoryResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: CATEGORY_DELETED_MESSAGE,
        data: categoryDeleted,
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
