import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateExpense, Expense } from '../expenses.entity';
import { CategoriesService } from '../../categories/services/categories.service';
import { RecordsService } from '../../records/services/records.service';
import { CreateExpenseDto } from '../expenses.dto';
import {
  EXPENSE_CREATED_MESSAGE,
  TYPE_OF_RECORD_INVALID,
} from '../expenses.constants';
import { isTypeOfRecord } from '../../utils/isTypeOfRecord';
import { changeTimezone } from '../../utils/changeTimezone';
import { formatDateToString, formatNumberToCurrency } from 'src/utils';
import { VERSION_RESPONSE } from 'src/constants';
import { ExpenseCreated } from '../expenses.interface';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel(CreateExpense.name) private expenseModel: Model<CreateExpense>,
    private categoriesService: CategoriesService,
    private recordsService: RecordsService,
  ) {}

  async createExpense(data: CreateExpenseDto, userId: string) {
    const { category, amount, typeOfRecord, date } = data;
    const dateWithTimezone = changeTimezone(date, 'America/Mexico_City');

    if (isTypeOfRecord(typeOfRecord) === false || typeOfRecord !== 'expense') {
      throw new BadRequestException(TYPE_OF_RECORD_INVALID);
    }

    const categoryId = await this.recordsService.findOrCreateCategory({
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
}
