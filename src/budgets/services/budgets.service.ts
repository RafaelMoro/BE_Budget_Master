import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Budget } from '../entities/budgets.entity';
import { Model } from 'mongoose';
import { CreateBudgetsDto } from '../dtos/budgets.dto';
import {
  BudgetsResponse,
  GeneralBudgetsResponse,
  SingleBudgetResponse,
} from '../budgets.interface';
import { VERSION_RESPONSE } from 'src/constants';
import { BUDGET_CREATED_MESSAGE } from '../budgets.constants';

@Injectable()
export class BudgetsService {
  constructor(@InjectModel(Budget.name) private budgetModel: Model<Budget>) {}

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
}
