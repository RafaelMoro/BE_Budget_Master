import { Types } from 'mongoose';
import { Category } from './entities/categories.entity';
import { GeneralResponse } from '../response.interface';

export interface CategoriesResponse extends Category {
  _id: Types.ObjectId;
}

export interface GeneralCategoriesResponse
  extends Omit<GeneralResponse, 'data'> {
  data: {
    categories: CategoriesResponse[];
  };
}

export interface LocalCategories {
  foodAndDrink: string;
  house: string;
  utilities: string;
  subcriptions: string;
  transportation: string;
  financialExpenses: string;
  healthCare: string;
  kids: string;
  shopping: string;
  entertainment: string;
  savings: string;
}

export interface FindByNameResponse extends Omit<GeneralResponse, 'data'> {
  data: {
    categories: null | CategoriesResponse[];
  };
}

export interface SingleCategoryResponse extends Omit<GeneralResponse, 'data'> {
  data: {
    category: CategoriesResponse;
  };
}

export interface UpdateSubcategoriesResponse
  extends Omit<GeneralResponse, 'data'> {
  categoryId: Types.ObjectId | string;
}
