import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateExpense, Expense } from '../expenses.entity';
import { CategoriesService } from '../../categories/services/categories.service';
import { CreateExpenseDto, UpdateExpenseDto } from '../expenses.dto';
import {
  EXPENSE_CREATED_MESSAGE,
  EXPENSE_DELETED_MESSAGE,
  EXPENSE_NOT_FOUND,
  EXPENSE_UNAUTHORIZED_ERROR,
  TYPE_OF_RECORD_INVALID,
} from '../expenses.constants';
import { isTypeOfRecord } from '../../utils/isTypeOfRecord';
import { changeTimezone } from '../../utils/changeTimezone';
import { formatDateToString, formatNumberToCurrency } from '../../utils';
import { INITIAL_RESPONSE, VERSION_RESPONSE } from '../../constants';
import {
  BatchExpensesResponse,
  RemoveExpenseProps,
  ResponseSingleExpense,
  UpdateExpenseProps,
} from '../expenses.interface';
import {
  MISSING_AMOUNT,
  MISSING_CATEGORY,
  MISSING_DATE,
} from '../../records/constants';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel(CreateExpense.name) private expenseModel: Model<CreateExpense>,
    private categoriesService: CategoriesService,
  ) {}

  async createExpense(data: CreateExpenseDto, userId: string) {
    const { category, amount, typeOfRecord, date } = data;
    const dateWithTimezone = changeTimezone(date, 'America/Mexico_City');

    if (isTypeOfRecord(typeOfRecord) === false || typeOfRecord !== 'expense') {
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
}
