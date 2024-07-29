import { BadRequestException, Injectable } from '@nestjs/common';
import { CategoriesService } from '../../../categories/services/categories.service';
import { CreateIncomeDto } from '../../../incomes/incomes.dto';
import { IncomesService } from '../../../incomes/services/incomes.service';
import { TYPE_OF_RECORD_INVALID } from '../../../records/constants';
import { isTypeOfRecord } from '../../../utils/isTypeOfRecord';
import { changeTimezone } from 'src/utils/changeTimezone';
import { formatDateToString, formatNumberToCurrency } from 'src/utils';
import { CreateExpense } from 'src/expenses/expenses.entity';
import { UpdateExpensePaidStatusDto } from 'src/expenses/expenses.dto';
import { ExpensesService } from 'src/expenses/services/expenses.service';
import { INCOME_CREATED_MESSAGE } from 'src/incomes/incomes.constants';
import { VERSION_RESPONSE } from 'src/constants';
import { ResponseSingleIncome } from 'src/incomes/incomes.interface';

@Injectable()
export class IncomesActionsService {
  constructor(
    private incomesService: IncomesService,
    private expensesService: ExpensesService,
    private categoriesService: CategoriesService,
  ) {}

  validateIncome(data: CreateIncomeDto) {
    const { typeOfRecord } = data;
    if (isTypeOfRecord(typeOfRecord) === false || typeOfRecord !== 'income') {
      throw new BadRequestException(TYPE_OF_RECORD_INVALID);
    }
  }

  formatCreateIncome({
    data,
    userId,
  }: {
    data: CreateIncomeDto;
    userId: string;
  }) {
    const { amount, typeOfRecord, date } = data;
    const dateWithTimezone = changeTimezone(date, 'America/Mexico_City');
    const { fullDate, formattedTime } = formatDateToString(dateWithTimezone);
    const amountFormatted = formatNumberToCurrency(amount);
    const newData = {
      ...data,
      fullDate,
      formattedTime,
      amountFormatted,
      userId,
      typeOfRecord,
    };
    return newData;
  }

  async createIncome({
    data,
    userId,
  }: {
    data: CreateIncomeDto;
    userId: string;
  }) {
    try {
      const messages: string[] = [];
      // 1. Validate data
      this.validateIncome(data);
      const { category } = data;

      // 2. Verify category exists
      await this.categoriesService.validateCategoryExists({
        categoryId: category,
      });

      // 3. Format income
      const dataFormatted = this.formatCreateIncome({ data, userId });

      // 4. Create income
      const incomeCreated = await this.incomesService.createIncome(
        dataFormatted,
      );
      messages.push(INCOME_CREATED_MESSAGE);

      // 5. Update expenses paid if there are any.
      if (incomeCreated.expensesPaid.length > 0) {
        // Typescript thinks is a CreateIncome[] but it's a string[]
        const expensesIds = data.expensesPaid as unknown as string[];
        const payload: UpdateExpensePaidStatusDto[] = expensesIds.map(
          (expenseId) => ({
            recordId: expenseId,
            paidStatus: true,
          }),
        );
        await this.expensesService.updateMultipleExpensesPaidStatus(payload);
        messages.push('Expenses paid updated');
      }

      // modelPopulated = await this.incomeModel.populate(modelSaved, {
      //   path: 'expensesPaid',
      //   select: '_id shortName amountFormatted fullDate formattedTime',
      // });
      // modelPopulated = await this.incomeModel.populate(modelPopulated, {
      //   path: 'category',
      //   select: '_id categoryName icon',
      // });

      // 6. Return response
      const response: ResponseSingleIncome = {
        version: VERSION_RESPONSE,
        success: true,
        message: messages,
        data: {
          income: incomeCreated,
        },
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
