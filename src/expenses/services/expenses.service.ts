import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateExpense, Expense } from '../expenses.entity';
import {
  CreateExpenseDto,
  DeleteExpenseDto,
  UpdateExpenseDto,
} from '../expenses.dto';
import {
  EXPENSE_NOT_FOUND,
  EXPENSE_UNAUTHORIZED_ERROR,
  EXPENSES_NOT_FOUND,
  UNAUTHORIZED_EXPENSES_ERROR,
} from '../expenses.constants';
import { INITIAL_RESPONSE } from '../../constants';
import {
  BatchExpensesResponse,
  DeleteMultipleExpensesResponse,
  FindAllExpensesByAccountResponse,
  FindExpensesByMonthYearProps,
  RemoveExpenseProps,
  ResponseMultipleExpenses,
} from '../expenses.interface';
import { getMonthNumber } from '../../utils/getMonthNumber';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel(CreateExpense.name) private expenseModel: Model<CreateExpense>,
  ) {}

  async findExpenseById(expenseId: string) {
    try {
      const expense: Expense = await this.expenseModel
        .findById(expenseId)
        .exec();
      return expense;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createExpense(data: CreateExpenseDto) {
    try {
      const model = new this.expenseModel(data);
      const modelSaved: Expense = await model.save();
      let modelPopulated: Expense = await this.expenseModel.populate(
        modelSaved,
        {
          path: 'category',
          select: '_id categoryName icon',
        },
      );
      modelPopulated = await this.expenseModel.populate(modelPopulated, {
        path: 'linkedBudgets',
      });

      return modelPopulated;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createTransferExpense(data: CreateExpenseDto) {
    try {
      const model = new this.expenseModel(data);
      const modelSaved: Expense = await model.save();
      const { _id: expenseId, account: accountExpense } = modelSaved;
      return { expenseId, accountExpense };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  verifyExpensesBelongsToUser(expenses: Expense[], userId: string) {
    if (expenses.length === 0) return expenses;
    if (expenses[0]?.userId !== userId) {
      throw new UnauthorizedException(UNAUTHORIZED_EXPENSES_ERROR);
    }

    return expenses;
  }

  getStartEndDate({ month, year }: { month: string; year: string }) {
    const monthNumber = getMonthNumber(month);
    const yearNumber = Number(year);

    const startDate = new Date(yearNumber, monthNumber, 1);
    const endDate = new Date(yearNumber, monthNumber + 1, 1);

    return { startDate, endDate };
  }

  /**
   * Method used to search for expenses (only record type expense) that are related to an income.
   */
  async findOnlyExpensesByMonthAndYear({
    accountId,
    month,
    year,
    userId,
  }: FindExpensesByMonthYearProps): Promise<ResponseMultipleExpenses> {
    try {
      const { startDate, endDate } = this.getStartEndDate({ month, year });
      const expenses: Expense[] = await this.expenseModel
        .aggregate([
          {
            $match: {
              date: {
                $gte: startDate,
                $lt: endDate,
              },
              userId,
              typeOfRecord: 'expense',
              account: accountId,
            },
          },
        ])
        .exec();

      this.verifyExpensesBelongsToUser(expenses, userId);
      if (expenses.length === 0) {
        return {
          ...INITIAL_RESPONSE,
          message: EXPENSES_NOT_FOUND,
          data: { expenses },
        };
      }

      let expensesPopulated: Expense[] = await this.expenseModel.populate(
        expenses,
        {
          path: 'category',
          select: '_id categoryName icon',
        },
      );
      expensesPopulated = await this.expenseModel.populate(expensesPopulated, {
        path: 'linkedBudgets',
      });

      const response: ResponseMultipleExpenses = {
        ...INITIAL_RESPONSE,
        data: { expenses: expensesPopulated },
      };
      return response;
    } catch (error) {
      if (error.status === 404) throw error;
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Method used to get expenses (expenses and transfers) by month and year.
   * This method is used by the records service to get all incomes and expenses by month and year
   */
  async findExpensesByMonthAndYearForRecords({
    accountId,
    month,
    year,
    userId,
  }: FindExpensesByMonthYearProps): Promise<Expense[]> {
    try {
      const { startDate, endDate } = this.getStartEndDate({ month, year });
      const expenses: Expense[] = await this.expenseModel
        .aggregate([
          {
            $match: {
              date: {
                $gte: startDate,
                $lt: endDate,
              },
              userId,
              account: accountId,
            },
          },
        ])
        .exec();

      this.verifyExpensesBelongsToUser(expenses, userId);
      if (expenses.length === 0) {
        return expenses;
      }

      const expensesPopulated: Expense[] = await this.expenseModel.populate(
        expenses,
        {
          path: 'category',
          select: '_id categoryName icon',
        },
      );

      return expensesPopulated;
    } catch (error) {
      if (error.status === 404) throw error;
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Method to get all expenses by account.
   * This method is used by the accounts service when deleting an account.
   */
  async findAllExpensesByAccount({
    accountId,
    userId,
  }: {
    accountId: string;
    userId: string;
  }): Promise<FindAllExpensesByAccountResponse> {
    try {
      const expenses: Expense[] = await this.expenseModel
        .aggregate([
          {
            $match: {
              userId,
              account: accountId,
            },
          },
        ])
        .exec();

      this.verifyExpensesBelongsToUser(expenses, userId);
      if (expenses.length === 0) {
        return {
          expenses,
          message: EXPENSES_NOT_FOUND,
        };
      }

      return {
        expenses,
        message: null,
      };
    } catch (error) {
      if (error.status === 404) throw error;
      throw new BadRequestException(error.message);
    }
  }

  async updateExpense({ changes }: { changes: UpdateExpenseDto }) {
    try {
      const { recordId } = changes;
      /** Update record in DB */
      const updatedRecord: Expense = await this.expenseModel
        .findByIdAndUpdate(recordId, { $set: changes }, { new: true })
        .populate({
          path: 'category',
          select: '_id categoryName icon',
        })
        .exec();

      if (!updatedRecord) throw new BadRequestException(EXPENSE_NOT_FOUND);

      return updatedRecord;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateMultipleExpenses(changes: UpdateExpenseDto[]) {
    try {
      const updatedRecords = await Promise.all(
        changes.map((change) =>
          this.expenseModel.findByIdAndUpdate(
            change.recordId,
            { $set: change },
            { new: true },
          ),
        ),
      );
      const checkUpdatedRecords = updatedRecords.map((record, index) => {
        if (!record) return `record id ${changes[index].recordId} not found`;
        return record;
      });
      const response: BatchExpensesResponse = {
        ...INITIAL_RESPONSE,
        data: checkUpdatedRecords,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async verifyRecordBelongsUser(recordId: string, userId: string) {
    try {
      const record = await this.expenseModel.findById(recordId);
      if (!record) throw new UnauthorizedException(EXPENSE_NOT_FOUND);

      const { userId: recordUserId } = record;
      if (userId !== recordUserId) {
        throw new UnauthorizedException(EXPENSE_UNAUTHORIZED_ERROR);
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async removeExpense({ payload, userId }: RemoveExpenseProps) {
    try {
      const { recordId } = payload;
      // Verify the expense belongs to the user
      await this.verifyRecordBelongsUser(recordId, userId);

      const recordDeleted: Expense = await this.expenseModel.findByIdAndDelete(
        recordId,
      );
      if (!recordDeleted) throw new BadRequestException(EXPENSE_NOT_FOUND);

      return recordDeleted;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Method to delete all expenses given an array of expense Ids.
   * This method is used by the accounts service when deleting an account.
   */
  async deleteMultipleExpenses(
    records: DeleteExpenseDto[],
  ): Promise<DeleteMultipleExpensesResponse> {
    try {
      const expensesIds = records.map((record) => record.recordId);
      const deletedRecords: Expense[] = await Promise.all(
        expensesIds.map((id) => this.expenseModel.findByIdAndDelete(id)),
      );
      const checkDeletedRecords = deletedRecords.map(
        (record: Expense, index: number) => {
          if (!record) return `record id ${records[index].recordId} not found`;
          return record;
        },
      );

      return {
        expenses: checkDeletedRecords,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
