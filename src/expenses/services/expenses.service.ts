import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateExpense, Expense } from '../expenses.entity';
import { CategoriesService } from '../../categories/services/categories.service';
import { CreateExpenseDto, UpdateExpenseDto } from '../expenses.dto';
import {
  EXPENSE_CREATED_MESSAGE,
  TYPE_OF_RECORD_INVALID,
} from '../expenses.constants';
import { isTypeOfRecord } from '../../utils/isTypeOfRecord';
import { changeTimezone } from '../../utils/changeTimezone';
import { formatDateToString, formatNumberToCurrency } from '../../utils';
import { INITIAL_RESPONSE, VERSION_RESPONSE } from '../../constants';
import { BatchExpensesResponse, ExpenseCreated } from '../expenses.interface';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel(CreateExpense.name) private expenseModel: Model<CreateExpense>,
    private categoriesService: CategoriesService,
  ) {}

  async findOrCreateCategory({
    category,
    userId,
  }: {
    category: string;
    userId: string;
  }) {
    try {
      const {
        data: { categories },
      } = await this.categoriesService.findOrCreateByNameAndUserId({
        categoryName: category,
        userId,
      });
      const [categoryFoundOrCreated] = categories;
      const { _id: categoryId } = categoryFoundOrCreated;
      return categoryId;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createExpense(data: CreateExpenseDto, userId: string) {
    const { category, amount, typeOfRecord, date } = data;
    const dateWithTimezone = changeTimezone(date, 'America/Mexico_City');

    if (isTypeOfRecord(typeOfRecord) === false || typeOfRecord !== 'expense') {
      throw new BadRequestException(TYPE_OF_RECORD_INVALID);
    }

    const categoryId = await this.findOrCreateCategory({
      category,
      userId,
    });
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

    const response: ExpenseCreated = {
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
}
