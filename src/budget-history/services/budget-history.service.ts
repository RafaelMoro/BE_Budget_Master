import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BudgetHistory } from '../budget-history.entity';
import { CreateBudgetHistoryDto } from '../budget-history.dto';
import {
  BudgetHistoryResponse,
  GeneralBudgetHistoryResponse,
  SingleBudgetHistoryResponse,
} from '../budget-history.interface';
import { VERSION_RESPONSE } from '../../constants';
import { BUDGET_HISTORY_CREATED } from '../budget-history.constants';

@Injectable()
export class BudgetHistoryService {
  constructor(
    @InjectModel(BudgetHistory.name)
    private budgetHistoryModel: Model<BudgetHistory>,
  ) {}

  async createBudgtHistory(payload: CreateBudgetHistoryDto) {
    try {
      const newBudget = new this.budgetHistoryModel(payload);
      const model: BudgetHistoryResponse = await newBudget.save();
      const response: SingleBudgetHistoryResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: BUDGET_HISTORY_CREATED,
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

  async getBudgetHistory({
    sub,
    budgetHistoryId,
  }: {
    sub: string;
    budgetHistoryId: string;
  }) {
    try {
      const budgets = await this.budgetHistoryModel
        .find({ _id: budgetHistoryId, userId: sub })
        .populate('budgetId')
        .exec();
      const response: GeneralBudgetHistoryResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: 'Budgets fetched successfully',
        data: {
          budgets,
        },
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
