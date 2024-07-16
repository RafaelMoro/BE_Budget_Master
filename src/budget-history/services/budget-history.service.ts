import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { BudgetHistory } from '../budget-history.entity';
import {
  CreateBudgetHistoryDto,
  DeleteBudgetHistoryDto,
  RecordsHistory,
  UpdateBudgetHistoryDto,
} from '../budget-history.dto';
import {
  AddRecordToBudgetHistoryProps,
  BudgetHistoryResponse,
  GeneralBudgetHistoryResponse,
  RemoveBudgetHistoryByBudgetIdResponse,
  RemoveRecordFromBudgetHistoryProps,
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

  async createBudgtHistory({
    payload,
    sub,
  }: {
    payload: CreateBudgetHistoryDto;
    sub: string;
  }) {
    try {
      const payloadWithSub = { ...payload, sub };
      const newBudget = new this.budgetHistoryModel(payloadWithSub);
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

  async getSingleBudgetHistory({
    sub,
    budgetHistoryId,
  }: {
    sub: string;
    budgetHistoryId: string;
  }) {
    try {
      const budgets = await this.budgetHistoryModel
        .find({ _id: budgetHistoryId, userId: sub })
        .populate('budget')
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
      if (error.status === 404) throw error;
      throw new BadRequestException(error.message);
    }
  }

  async getBudgetsHistory(sub: string) {
    try {
      const budgetsHistory = await this.budgetHistoryModel
        .find({ sub }, { sub: 0 })
        .populate('budget')
        .exec();
      if (budgetsHistory.length === 0) {
        throw new NotFoundException(BUDGET_HISTORY_NOT_FOUND_ERROR);
      }
      const response: GeneralBudgetHistoryResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: null,
        data: {
          budgetsHistory: budgetsHistory,
        },
        error: null,
      };
      return response;
    } catch (error) {
      if (error.status === 404) throw error;
      throw new BadRequestException(error.message);
    }
  }

  async removeBudgetHistory({
    payload,
    sub,
  }: {
    payload: DeleteBudgetHistoryDto;
    sub: string;
  }) {
    try {
      const { budgetHistoryId } = payload;
      const budgetHistoryDeleted: BudgetHistoryResponse =
        await this.budgetHistoryModel.findOneAndDelete({
          _id: budgetHistoryId,
          sub,
        });
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
      if (error.status === 404) throw error;
      throw new BadRequestException(error.message);
    }
  }

  async removeBudgetHistoryByBudgetId(
    budgetId: string,
    sub: string,
  ): Promise<RemoveBudgetHistoryByBudgetIdResponse> {
    try {
      const budgetHistoryDeleted: BudgetHistoryResponse =
        await this.budgetHistoryModel.findOneAndDelete({
          budget: new Types.ObjectId(budgetId),
          sub,
        });
      if (!budgetHistoryDeleted) {
        return {
          message: BUDGET_HISTORY_NOT_FOUND_ERROR,
          budgetHistory: null,
        };
      }

      return {
        message: null,
        budgetHistory: budgetHistoryDeleted,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateBudgetHistory({
    changes,
    sub,
  }: {
    changes: UpdateBudgetHistoryDto;
    sub: string;
  }) {
    try {
      // Excluding budget id from the changes
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { budgetHistoryId, budget, ...restChanges } = changes;
      const updateBudgetHistory: BudgetHistoryResponse =
        await this.budgetHistoryModel
          .findOneAndUpdate(
            { _id: budgetHistoryId, sub },
            { $set: restChanges },
            { new: true },
          )
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
      if (error.status === 404) throw error;
      throw new BadRequestException(error.message);
    }
  }

  async addRecordToBudgetHistory({
    newRecord,
    sub,
    budgetId,
  }: AddRecordToBudgetHistoryProps) {
    try {
      // Searching by converting string to object id, otherwise, it won't find it.
      const budgetsHistory = await this.budgetHistoryModel
        .find({ budget: new Types.ObjectId(budgetId), sub })
        .exec();
      if (budgetsHistory.length === 0) {
        throw new NotFoundException(BUDGET_HISTORY_NOT_FOUND_ERROR);
      }

      const [firstBudgetHistory] = budgetsHistory;
      const { _id: budgetHistoryId } = firstBudgetHistory;
      const newRecords = firstBudgetHistory.records;
      newRecords.push(newRecord);
      const updatedBudgetHistory = {
        ...firstBudgetHistory.toObject(),
        records: newRecords,
      };

      const updateBudgetHistoryModel =
        await this.budgetHistoryModel.findByIdAndUpdate(
          budgetHistoryId,
          { $set: updatedBudgetHistory },
          { new: true },
        );
      const response: SingleBudgetHistoryResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: 'Record added to budget history',
        data: {
          budgetHistory: updateBudgetHistoryModel,
        },
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async removeRecordFromBudgetHistory({
    recordToBeDeleted,
    sub,
    budgetHistoryId,
  }: RemoveRecordFromBudgetHistoryProps) {
    try {
      const budgetsHistory = await this.budgetHistoryModel
        .find({ _id: budgetHistoryId, sub })
        .exec();
      if (budgetsHistory.length === 0) {
        throw new NotFoundException(BUDGET_HISTORY_NOT_FOUND_ERROR);
      }

      const [firstBudgetHistory] = budgetsHistory;
      // We have to set as unkown as the type first is Types.Array<Record<'string | date | number', any>> and does not match with RecordsHistory[]
      const records: RecordsHistory[] =
        firstBudgetHistory.records as unknown as RecordsHistory[];
      const filteredRecord = records.filter(
        (record) => record?.recordId !== recordToBeDeleted.toString(),
      );
      const updatedBudgetHistory = {
        ...firstBudgetHistory.toObject(),
        records: filteredRecord,
      };

      const updateBudgetHistoryModel =
        await this.budgetHistoryModel.findByIdAndUpdate(
          budgetHistoryId,
          { $set: updatedBudgetHistory },
          { new: true },
        );
      const response: SingleBudgetHistoryResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: 'Record removed from budget history',
        data: {
          budgetHistory: updateBudgetHistoryModel,
        },
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
