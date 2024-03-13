import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Category } from '../entities/categories.entity';
import {
  CategoriesResponse,
  FindByNameAndUserIdProps,
  FindByNameResponse,
  GeneralCategoriesResponse,
  SingleCategoryResponse,
} from '../interface';
import {
  CreateCategoriesDto,
  DeleteCategoryDto,
  UpdateCategoriesDto,
} from '../dtos/categories.dto';
import { VERSION_RESPONSE } from '../../constants';
import {
  ALL_LOCAL_CATEGORIES,
  CATEGORY_CREATED_MESSAGE,
  CATEGORY_DELETED_MESSAGE,
  CATEGORY_NOT_FOUND_ERROR,
  LOCAL_CATEGORIES_EXISTS_ERROR,
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
        data: {
          categories,
        },
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
        data: { categories: category },
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findByNameAndUserId({
    categoryName,
    userId,
    isCreateLocalCategoriesService = false,
  }: FindByNameAndUserIdProps) {
    try {
      const initialResponse: FindByNameResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: null,
        data: null,
        error: null,
      };
      const category: CategoriesResponse[] = await this.categoryModel
        .find({ categoryName, sub: userId })
        .exec();

      // If the category was not found, return that response
      if (category.length === 0) {
        if (isCreateLocalCategoriesService) {
          const responseCategoryNotFound = {
            ...initialResponse,
            message: CATEGORY_NOT_FOUND_ERROR,
          };
          return responseCategoryNotFound;
        }
        throw new BadRequestException(CATEGORY_NOT_FOUND_ERROR);
      }

      const response: FindByNameResponse = {
        ...initialResponse,
        data: {
          categories: category,
        },
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
        message: CATEGORY_CREATED_MESSAGE,
        data: {
          category: model,
        },
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createLocalCategories(userId: string) {
    try {
      const [firstCategory] = ALL_LOCAL_CATEGORIES;
      const { categoryName } = firstCategory;
      const localCategoryExist = await this.findByNameAndUserId({
        categoryName,
        userId,
        isCreateLocalCategoriesService: true,
      });
      if (localCategoryExist.message !== CATEGORY_NOT_FOUND_ERROR) {
        throw new BadRequestException(LOCAL_CATEGORIES_EXISTS_ERROR);
      }

      const localCategoriesModels = ALL_LOCAL_CATEGORIES.map((category) => {
        return new this.categoryModel({ ...category, sub: userId });
      });
      const saveCategoriesModels = await Promise.all(
        localCategoriesModels.map((model) => model.save()),
      );
      const response: GeneralCategoriesResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: CATEGORY_CREATED_MESSAGE,
        data: {
          categories: saveCategoriesModels,
        },
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
      if (!updateCategory)
        throw new BadRequestException(CATEGORY_NOT_FOUND_ERROR);
      const response: SingleCategoryResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: null,
        data: {
          category: updateCategory,
        },
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateSubcategories(category: CategoriesResponse, subCategory: string) {
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
        const response: SingleCategoryResponse = {
          version: VERSION_RESPONSE,
          success: true,
          message: SUBCATEGORY_CREATED_SUCCESS,
          data: categoryUpdated,
          error: null,
        };
        return response;
      }

      const response: SingleCategoryResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: SUBCATEGORY_ERROR,
        data: {
          category,
        },
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
      if (!categoryDeleted)
        throw new BadRequestException(CATEGORY_NOT_FOUND_ERROR);

      const response: SingleCategoryResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: CATEGORY_DELETED_MESSAGE,
        data: {
          category: categoryDeleted,
        },
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
