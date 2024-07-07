import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Budget } from '../entities/budgets.entity';
import { Model } from 'mongoose';
import { CreateBudgetsDto } from '../dtos/budgets.dto';

@Injectable()
export class BudgetsService {
  constructor(@InjectModel(Budget.name) private budgetModel: Model<Budget>) {}

  async createBudget(payload: CreateBudgetsDto) {
    try {
      const newBudget = new this.budgetModel(payload);
      const model = await newBudget.save();
      return model;
      // It's missing to format response
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
