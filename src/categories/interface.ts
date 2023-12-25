import { Types } from 'mongoose';
import { Category } from './entities/categories.entity';
import { GeneralResponse } from '../response.interface';

export interface UpdateSubcategoriesResponse {
  message: string | null;
  categoryId: string;
}

export interface CategoriesResponse extends Category {
  _id: Types.ObjectId;
}

export interface GetCategoriesResponse extends Omit<GeneralResponse, 'data'> {
  data: CategoriesResponse[];
}
