import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Category } from '../entities/categories.entity';
import { Model } from 'mongoose';
import { CreateCategoriesDto } from '../dtos/categories.dto';
// import {  }

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  async findbyUser(sub: string) {
    try {
      const categories = await this.categoryModel.find({ sub }).exec();
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
}
