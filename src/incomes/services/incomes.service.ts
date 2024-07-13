import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateIncome, Income } from '../incomes.entity';
import { CategoriesService } from '../../categories/services/categories.service';
import { CreateIncomeDto, UpdateIncomeDto } from '../incomes.dto';
import { isTypeOfRecord } from '../../utils/isTypeOfRecord';
import {
  MISSING_AMOUNT,
  MISSING_CATEGORY,
  MISSING_DATE,
  TYPE_OF_RECORD_INVALID,
} from '../../records/constants';
import { changeTimezone } from '../../utils/changeTimezone';
import { formatDateToString, formatNumberToCurrency } from '../../utils';
import { CreateExpense } from '../../expenses/expenses.entity';
import { UpdateExpenseDto } from '../../expenses/expenses.dto';
import {
  BatchIncomesResponse,
  RemoveIncomeProps,
  ResponseSingleIncome,
  UpdateIncomeProps,
} from '../incomes.interface';
import { INITIAL_RESPONSE, VERSION_RESPONSE } from '../../constants';
import {
  INCOME_CREATED_MESSAGE,
  INCOME_DELETED_MESSAGE,
  INCOME_NOT_FOUND,
  INCOME_UNAUTHORIZED_ERROR,
} from '../incomes.constants';
import { ExpensesService } from '../../expenses/services/expenses.service';

@Injectable()
export class IncomesService {
  constructor(
    @InjectModel(CreateIncome.name) private incomeModel: Model<CreateIncome>,
    private categoriesService: CategoriesService,
    private expensesService: ExpensesService,
  ) {}

  async createIncome(data: CreateIncomeDto, userId: string) {
    try {
      const { category, amount, typeOfRecord, date } = data;
      const dateWithTimezone = changeTimezone(date, 'America/Mexico_City');

      if (isTypeOfRecord(typeOfRecord) === false || typeOfRecord !== 'income') {
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

      const model = new this.incomeModel(newData);
      const modelSaved: Income = await model.save();
      let modelPopulated: Income;

      if (modelSaved.expensesPaid.length > 0) {
        const expensesIds: CreateExpense[] = (data as CreateIncomeDto)
          .expensesPaid;
        const payload: UpdateExpenseDto[] = expensesIds.map((expense) => ({
          recordId: expense._id,
          isPaid: true,
          userId,
        }));
        await this.expensesService.updateMultipleExpenses(payload);
      }

      modelPopulated = await this.incomeModel.populate(modelSaved, {
        path: 'expensesPaid',
        select: '_id shortName amountFormatted fullDate formattedTime',
      });
      modelPopulated = await this.incomeModel.populate(modelPopulated, {
        path: 'category',
        select: '_id categoryName icon',
      });

      const response: ResponseSingleIncome = {
        version: VERSION_RESPONSE,
        success: true,
        message: INCOME_CREATED_MESSAGE,
        data: {
          income: modelPopulated,
        },
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateIncome({
    changes,
    userId,
    skipFindCategory = false,
    skipUpdateExpensesPaid = false,
  }: UpdateIncomeProps) {
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
        throw new UnauthorizedException(INCOME_UNAUTHORIZED_ERROR);
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

      const updatedRecord: Income = await this.incomeModel
        .findByIdAndUpdate(recordId, { $set: newChanges }, { new: true })
        .exec();

      if (!updatedRecord) throw new BadRequestException(INCOME_NOT_FOUND);

      // Update the prop isPaid to true of the expenses related to this income
      if (changes.expensesPaid?.length > 0 && !skipUpdateExpensesPaid) {
        const expensesIds: CreateExpense[] = (changes as CreateIncomeDto)
          .expensesPaid;
        const payload: UpdateExpenseDto[] = expensesIds.map((expense) => ({
          recordId: expense._id,
          isPaid: true,
          userId,
        }));
        await this.expensesService.updateMultipleExpenses(payload);
      }

      const response: ResponseSingleIncome = {
        ...INITIAL_RESPONSE,
        data: {
          income: updatedRecord,
        },
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async verifyRecordBelongsUser(recordId: string, userId: string) {
    try {
      const record = await this.incomeModel.findById(recordId);
      if (!record) throw new UnauthorizedException(INCOME_NOT_FOUND);

      const { userId: recordUserId } = record;
      if (userId !== recordUserId) {
        throw new UnauthorizedException(INCOME_UNAUTHORIZED_ERROR);
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async removeIncome({ payload, userId }: RemoveIncomeProps) {
    try {
      const { incomeId } = payload;
      await this.verifyRecordBelongsUser(incomeId, userId);

      const income = await this.incomeModel.findById(incomeId);

      // Check if there are any expenses related to this income
      if (income?.expensesPaid?.length > 0) {
        // set expenses as not paid
        const payload: UpdateExpenseDto[] = income.expensesPaid.map(
          (expense) => ({
            recordId: expense._id,
            isPaid: false,
            userId,
          }),
        );
        await this.expensesService.updateMultipleExpenses(payload);
      }

      const recordDeleted: Income = await this.incomeModel.findByIdAndDelete(
        incomeId,
      );
      if (!recordDeleted) throw new BadRequestException(INCOME_NOT_FOUND);

      const response: ResponseSingleIncome = {
        ...INITIAL_RESPONSE,
        message: INCOME_DELETED_MESSAGE,
        data: {
          income: recordDeleted,
        },
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateMultipleIncomes(changes: UpdateIncomeDto[]) {
    try {
      const updatedRecords = await Promise.all(
        changes.map((change) =>
          this.incomeModel.findByIdAndUpdate(
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
      const response: BatchIncomesResponse = {
        ...INITIAL_RESPONSE,
        data: checkUpdatedRecords,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
