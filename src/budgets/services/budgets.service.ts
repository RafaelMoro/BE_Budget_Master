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
  UpdateAmountBudgetDto,
  UpdateBudgetDto,
} from '../budgets.dto';
import {
  Budget,
  CreateBudgetResponse,
  ExpenseOperation,
  GeneralBudgetsResponse,
  RemoveBudgetResponse,
  SingleBudgetResponse,
  UpdateAmountBudgetResponse,
} from '../budgets.interface';
import { VERSION_RESPONSE } from 'src/constants';
import {
  BUDGET_CREATED_MESSAGE,
  BUDGET_DELETED_MESSAGE,
  BUDGET_NOT_FOUND_ERROR,
  BUDGETS_NOT_FOUND_ERROR,
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
      const initialResponse: GeneralBudgetsResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: null,
        data: null,
        error: null,
      };
      const budgets = await this.budgetModel.find({ sub }, { sub: 0 }).exec();
      if (budgets.length === 0) {
        return {
          ...initialResponse,
          message: BUDGETS_NOT_FOUND_ERROR,
          data: null,
        };
      }
      const response: GeneralBudgetsResponse = {
        ...initialResponse,
        data: {
          budgets,
        },
      };
      return response;
    } catch (error) {
      if (error.status === 404) throw error;
      throw new BadRequestException(error.message);
    }
  }

  async getSingleBudget({ budgetId, sub }: { budgetId: string; sub: string }) {
    try {
      const initialResponse: SingleBudgetResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: null,
        data: {
          budget: null,
        },
        error: null,
      };
      const budgets = await this.budgetModel
        .find({ _id: budgetId, sub })
        .exec();
      if (budgets.length === 0) {
        return {
          ...initialResponse,
          message: BUDGET_NOT_FOUND_ERROR,
          data: null,
        };
      }

      const [singleBudget] = budgets;
      const response: SingleBudgetResponse = {
        ...initialResponse,
        data: {
          budget: singleBudget,
        },
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

  /**
   * Method used to update current amount of the budget in expense service
   */
  async updateBudgetAmount({
    changes,
    sub,
    expenseOperation,
  }: {
    changes: UpdateAmountBudgetDto;
    sub: string;
    expenseOperation: ExpenseOperation;
  }): Promise<UpdateAmountBudgetResponse> {
    try {
      const { budgetId, amountRecord } = changes;
      const budget: Budget = await this.budgetModel
        .findOne({ _id: budgetId, sub })
        .exec();
      if (!budget) {
        return {
          budget: budget,
          message: BUDGET_NOT_FOUND_ERROR,
        };
      }
      const { currentAmount } = budget;

      let updatedAmount: number;
      if (expenseOperation === 'removeExpense') {
        updatedAmount = currentAmount - amountRecord;
      } else {
        updatedAmount = currentAmount + amountRecord;
      }

      const updatedBudget = await this.budgetModel
        .findByIdAndUpdate(
          budget._id,
          { $set: { currentAmount: updatedAmount } },
          { new: true },
        )
        .exec();

      return {
        budget: updatedBudget,
        message: null,
      };
    } catch (error) {
      if (error.status === 404) throw error;
      throw new BadRequestException(error.message);
    }
  }
}
