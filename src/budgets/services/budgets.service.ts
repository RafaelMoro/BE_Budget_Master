import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Budget } from '../entities/budgets.entity';
import { Model } from 'mongoose';
import { CreateBudgetsDto } from '../dtos/budgets.dto';
import { BudgetsResponse, SingleBudgetResponse } from '../budgets.interface';
import { VERSION_RESPONSE } from 'src/constants';
import { BUDGET_CREATED_MESSAGE } from '../budgets.constants';

@Injectable()
export class BudgetsService {
  constructor(@InjectModel(Budget.name) private budgetModel: Model<Budget>) {}

  async createBudget(payload: CreateBudgetsDto) {
    try {
      const newBudget = new this.budgetModel(payload);
      const model: BudgetsResponse = await newBudget.save();
      const response: SingleBudgetResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: BUDGET_CREATED_MESSAGE,
        data: {
          budget: model,
        },
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
