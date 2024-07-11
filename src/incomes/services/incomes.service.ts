import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateIncome, Income } from '../incomes.entity';
import { CategoriesService } from '../../categories/services/categories.service';
import { CreateIncomeDto, UpdateIncomeDto } from '../incomes.dto';
import { isTypeOfRecord } from '../../utils/isTypeOfRecord';
import { TYPE_OF_RECORD_INVALID } from '../../records/constants';
import { changeTimezone } from '../../utils/changeTimezone';
import { formatDateToString, formatNumberToCurrency } from 'src/utils';
import { CreateExpense } from 'src/expenses/expenses.entity';
import { UpdateExpenseDto } from 'src/expenses/expenses.dto';
import { BatchIncomesResponse, IncomeCreated } from '../incomes.interface';
import { INITIAL_RESPONSE, VERSION_RESPONSE } from 'src/constants';
import { INCOME_CREATED_MESSAGE } from '../incomes.constants';
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
        const payload: UpdateExpenseDto[] = expensesIds.map((id) => ({
          recordId: id,
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

      const response: IncomeCreated = {
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
