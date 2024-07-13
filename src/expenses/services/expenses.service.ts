import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateExpense, Expense } from '../expenses.entity';
import { CategoriesService } from '../../categories/services/categories.service';
import {
  CreateExpenseDto,
  DeleteExpenseDto,
  UpdateExpenseDto,
} from '../expenses.dto';
import {
  EXPENSE_CREATED_MESSAGE,
  EXPENSE_DELETED_MESSAGE,
  EXPENSE_NOT_FOUND,
  EXPENSE_UNAUTHORIZED_ERROR,
  EXPENSES_NOT_FOUND,
  TYPE_OF_RECORD_INVALID,
  UNAUTHORIZED_EXPENSES_ERROR,
} from '../expenses.constants';
import { isTypeOfRecord } from '../../utils/isTypeOfRecord';
import { changeTimezone } from '../../utils/changeTimezone';
import { formatDateToString, formatNumberToCurrency } from '../../utils';
import { INITIAL_RESPONSE, VERSION_RESPONSE } from '../../constants';
import {
  BatchExpensesResponse,
  DeleteMultipleExpensesResponse,
  FindAllExpensesByAccountResponse,
  FindExpensesByMonthYearProps,
  RemoveExpenseProps,
  ResponseMultipleExpenses,
  ResponseSingleExpense,
  UpdateExpenseProps,
} from '../expenses.interface';
import {
  MISSING_AMOUNT,
  MISSING_CATEGORY,
  MISSING_DATE,
} from '../../records/constants';
import { getMonthNumber } from 'src/utils/getMonthNumber';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel(CreateExpense.name) private expenseModel: Model<CreateExpense>,
    private categoriesService: CategoriesService,
  ) {}

  async createExpense(data: CreateExpenseDto, userId: string) {
    try {
      const { category, amount, typeOfRecord, date } = data;
      const dateWithTimezone = changeTimezone(date, 'America/Mexico_City');

      if (
        isTypeOfRecord(typeOfRecord) === false ||
        typeOfRecord !== 'expense'
      ) {
        throw new BadRequestException(TYPE_OF_RECORD_INVALID);
      }

      const categoryId =
        await this.categoriesService.findOrCreateCategoriesByNameAndUserIdForRecords(
          {
            categoryName: category,
            userId,
          },
        );
      const { fullDate, formattedTime } = formatDateToString(dateWithTimezone);
      const amountFormatted = formatNumberToCurrency(amount);
      const newData = {
        ...data,
        fullDate,
        formattedTime,
        category: categoryId,
        amountFormatted,
        userId,
        typeOfRecord,
      };

      const model = new this.expenseModel(newData);
      const modelSaved: Expense = await model.save();
      const modelPopulated: Expense = await this.expenseModel.populate(
        modelSaved,
        {
          path: 'category',
          select: '_id categoryName icon',
        },
      );

      const response: ResponseSingleExpense = {
        version: VERSION_RESPONSE,
        success: true,
        message: EXPENSE_CREATED_MESSAGE,
        data: {
          expense: modelPopulated,
        },
        error: null,
      };
      return response;
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
        throw new NotFoundException(EXPENSES_NOT_FOUND);
      }

      const expensesPopulated: Expense[] = await this.expenseModel.populate(
        expenses,
        {
          path: 'category',
          select: '_id categoryName icon',
        },
      );

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

  async updateExpense({
    changes,
    userId,
    skipFindCategory = false,
  }: UpdateExpenseProps) {
    try {
      const {
        recordId,
        category,
        date,
        amount,
        userId: userIdChanges,
      } = changes;

      // Verify that the record belongs to the user
      if (userId !== userIdChanges) {
        throw new UnauthorizedException(EXPENSE_UNAUTHORIZED_ERROR);
      }
      if (!date) throw new UnauthorizedException(MISSING_DATE);
      if (!category) throw new UnauthorizedException(MISSING_CATEGORY);
      if (!amount) throw new UnauthorizedException(MISSING_AMOUNT);

      const dateWithTimezone = changeTimezone(date, 'America/Mexico_City');

      let categoryId = category;
      if (!skipFindCategory) {
        const categoryIdFetched =
          await this.categoriesService.findOrCreateCategoriesByNameAndUserIdForRecords(
            {
              categoryName: category,
              userId,
            },
          );
        categoryId = categoryIdFetched.toString();
      }
      const { fullDate, formattedTime } = formatDateToString(dateWithTimezone);
      const amountFormatted = formatNumberToCurrency(amount);
      const newChanges = {
        ...changes,
        category: categoryId,
        fullDate,
        formattedTime,
        amountFormatted,
      };

      const updatedRecord: Expense = await this.expenseModel
        .findByIdAndUpdate(recordId, { $set: newChanges }, { new: true })
        .populate({
          path: 'category',
          select: '_id categoryName icon',
        })
        .exec();

      if (!updatedRecord) throw new BadRequestException(EXPENSE_NOT_FOUND);

      const response: ResponseSingleExpense = {
        ...INITIAL_RESPONSE,
        data: {
          expense: updatedRecord,
        },
      };
      return response;
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
      console.log('response', response);
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
      const { expenseId } = payload;
      await this.verifyRecordBelongsUser(expenseId, userId);

      const recordDeleted: Expense = await this.expenseModel.findByIdAndDelete(
        expenseId,
      );
      if (!recordDeleted) throw new BadRequestException(EXPENSE_NOT_FOUND);

      const response: ResponseSingleExpense = {
        ...INITIAL_RESPONSE,
        message: EXPENSE_DELETED_MESSAGE,
        data: {
          expense: recordDeleted,
        },
      };
      return response;
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
      const expensesIds = records.map((record) => record.expenseId);
      const deletedRecords: Expense[] = await Promise.all(
        expensesIds.map((id) => this.expenseModel.findByIdAndDelete(id)),
      );
      const checkDeletedRecords = deletedRecords.map(
        (record: Expense, index: number) => {
          if (!record) return `record id ${records[index].expenseId} not found`;
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
