import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BudgetModel } from '../budgets.entity';
import { Model } from 'mongoose';

import {
  CreateBudgetsDto,
  DeleteBudgetDto,
  UpdateBudgetDto,
} from '../budgets.dto';
import {
  Budget,
  CreateBudgetResponse,
  GeneralBudgetsResponse,
  RemoveBudgetResponse,
  SingleBudgetResponse,
} from '../budgets.interface';
import { VERSION_RESPONSE } from 'src/constants';
import {
  BUDGET_CREATED_MESSAGE,
  BUDGET_DELETED_MESSAGE,
  BUDGET_NOT_FOUND_ERROR,
} from '../budgets.constants';
import { BudgetHistoryService } from '../../budget-history/services/budget-history.service';
import { CreateBudgetHistoryDto } from '../../budget-history/budget-history.dto';
import { BUDGET_HISTORY_NOT_FOUND_ERROR } from 'src/budget-history/budget-history.constants';

@Injectable()
export class BudgetsService {
  constructor(
    @InjectModel(BudgetModel.name) private budgetModel: Model<BudgetModel>,
    private budgetHistoryService: BudgetHistoryService,
  ) {}

  async createBudget({
    payload,
    sub,
  }: {
    payload: CreateBudgetsDto;
    sub: string;
  }) {
    try {
      const updatedPayload = { ...payload, sub };
      const newBudget = new this.budgetModel(updatedPayload);
      const model: Budget = await newBudget.save();

      // Create budget history
      const payloadBudgetHistory: CreateBudgetHistoryDto = {
        budget: model?._id,
        records: [],
      };
      const budgetHistoryResponse =
        await this.budgetHistoryService.createBudgtHistory({
          payload: payloadBudgetHistory,
          sub,
        });
      const {
        data: { budgetHistory },
      } = budgetHistoryResponse;

      const response: CreateBudgetResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: BUDGET_CREATED_MESSAGE,
        data: {
          budget: model,
          budgetHistory,
        },
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getBudgets(sub: string) {
    try {
      const budgets = await this.budgetModel.find({ sub }, { sub: 0 }).exec();
      if (budgets.length === 0) {
        throw new NotFoundException('No budgets found');
      }
      const response: GeneralBudgetsResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: null,
        data: {
          budgets,
        },
        error: null,
      };
      return response;
    } catch (error) {
      if (error.status === 404) throw error;
      throw new BadRequestException(error.message);
    }
  }

  async getSingleBudget({ budgetId, sub }: { budgetId: string; sub: string }) {
    try {
      const budgets = await this.budgetModel
        .find({ _id: budgetId, sub })
        .exec();
      if (budgets.length === 0) {
        throw new NotFoundException('Budget not found');
      }

      const [singleBudget] = budgets;
      const response: SingleBudgetResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: null,
        data: {
          budget: singleBudget,
        },
        error: null,
      };
      return response;
    } catch (error) {
      if (error.status === 404) throw error;
      throw new BadRequestException(error.message);
    }
  }

  async removeBudget({
    payload,
    sub,
  }: {
    payload: DeleteBudgetDto;
    sub: string;
  }) {
    try {
      const { budgetId } = payload;
      const budgetDeleted: Budget = await this.budgetModel.findOneAndDelete({
        _id: budgetId,
        sub,
      });
      if (!budgetDeleted) throw new NotFoundException(BUDGET_NOT_FOUND_ERROR);

      // Delete budget history
      const budgetHistoryDeleteResponse =
        await this.budgetHistoryService.removeBudgetHistoryByBudgetId(
          budgetId,
          sub,
        );
      if (
        budgetHistoryDeleteResponse.message === BUDGET_HISTORY_NOT_FOUND_ERROR
      ) {
        throw new NotFoundException(BUDGET_HISTORY_NOT_FOUND_ERROR);
      }

      const response: RemoveBudgetResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: BUDGET_DELETED_MESSAGE,
        data: {
          budget: budgetDeleted,
          budgetHistoryDeleted: budgetHistoryDeleteResponse.budgetHistory,
        },
        error: null,
      };
      return response;
    } catch (error) {
      if (error.status === 404) throw error;
      throw new BadRequestException(error.message);
    }
  }

  async updateBudget({
    changes,
    sub,
  }: {
    changes: UpdateBudgetDto;
    sub: string;
  }) {
    try {
      // Excluding budget id from the changes
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { budgetId } = changes;
      const updateBudget: Budget = await this.budgetModel
        .findOneAndUpdate(
          { _id: budgetId, sub },
          { $set: changes },
          { new: true },
        )
        .exec();
      if (!updateBudget) throw new NotFoundException(BUDGET_NOT_FOUND_ERROR);
      const response: SingleBudgetResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: 'Budget history updated',
        data: {
          budget: updateBudget,
        },
        error: null,
      };
      return response;
    } catch (error) {
      if (error.status === 404) throw error;
      throw new BadRequestException(error.message);
    }
  }
}
