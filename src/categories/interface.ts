import { Types } from 'mongoose';
import { Category } from './entities/categories.entity';
import { GeneralResponse } from '../response.interface';

export interface CategoriesResponse extends Category {
  _id: Types.ObjectId;
}

export interface GeneralCategoriesResponse
  extends Omit<GeneralResponse, 'data'> {
  data: CategoriesResponse[];
}

export interface SingleCategoryResponse extends Omit<GeneralResponse, 'data'> {
  data: CategoriesResponse;
}

export interface UpdateSubcategoriesResponse
  extends Omit<GeneralResponse, 'data'> {
  categoryId: Types.ObjectId | string;
}
