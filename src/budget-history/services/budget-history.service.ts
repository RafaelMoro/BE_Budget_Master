import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BudgetHistory } from '../budget-history.entity';
import {
  CreateBudgetHistoryDto,
  DeleteBudgetHistoryDto,
  UpdateBudgetHistoryDto,
} from '../budget-history.dto';
import {
  BudgetHistoryResponse,
  SingleBudgetHistoryResponse,
} from '../budget-history.interface';
import { VERSION_RESPONSE } from '../../constants';
import {
  BUDGET_HISTORY_CREATED,
  BUDGET_HISTORY_DELETED_MESSAGE,
  BUDGET_HISTORY_NOT_FOUND_ERROR,
} from '../budget-history.constants';

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
          budgetHistory: model,
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
      if (budgets.length === 0) {
        throw new NotFoundException(BUDGET_HISTORY_NOT_FOUND_ERROR);
      }

      const [budgetHistory] = budgets;
      const response: SingleBudgetHistoryResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: null,
        data: {
          budgetHistory,
        },
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async removeBudgetHistory(payload: DeleteBudgetHistoryDto) {
    try {
      const { budgetHistoryId } = payload;
      const budgetHistoryDeleted: BudgetHistoryResponse =
        await this.budgetHistoryModel.findByIdAndDelete(budgetHistoryId);
      if (!budgetHistoryDeleted)
        throw new NotFoundException(BUDGET_HISTORY_NOT_FOUND_ERROR);

      const response: SingleBudgetHistoryResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: BUDGET_HISTORY_DELETED_MESSAGE,
        data: {
          budgetHistory: budgetHistoryDeleted,
        },
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateBudgetHistory(changes: UpdateBudgetHistoryDto) {
    try {
      const { budgetHistoryId } = changes;
      const updateBudgetHistory: BudgetHistoryResponse =
        await this.budgetHistoryModel
          .findByIdAndUpdate(budgetHistoryId, { $set: changes }, { new: true })
          .exec();
      if (!updateBudgetHistory)
        throw new NotFoundException(BUDGET_HISTORY_NOT_FOUND_ERROR);
      const response: SingleBudgetHistoryResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: 'Budget history updated',
        data: {
          budgetHistory: updateBudgetHistory,
        },
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
