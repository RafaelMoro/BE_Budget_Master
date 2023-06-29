import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Category } from '../entities/categories.entity';
import { Model } from 'mongoose';
import { CreateCategoriesDto } from '../dtos/categories.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  async findAll() {
    try {
      return this.categoryModel.find().exec();
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createOne(payload: CreateCategoriesDto) {
    try {
      const newModel = new this.categoryModel(payload);
      const model = await newModel.save();
      return model;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
