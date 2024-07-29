import { BadRequestException, Injectable } from '@nestjs/common';
import { CategoriesService } from '../../../categories/services/categories.service';
import { CreateIncomeDto } from '../../../incomes/incomes.dto';
import { IncomesService } from '../../../incomes/services/incomes.service';
import { TYPE_OF_RECORD_INVALID } from '../../../records/constants';
import { isTypeOfRecord } from '../../../utils/isTypeOfRecord';
import { changeTimezone } from '../../../utils/changeTimezone';
import { formatDateToString, formatNumberToCurrency } from '../../../utils';
import { UpdateExpensePaidStatusDto } from '../../../expenses/expenses.dto';
import { ExpensesService } from '../../../expenses/services/expenses.service';
import { INCOME_CREATED_MESSAGE } from '../../../incomes/incomes.constants';
import { VERSION_RESPONSE } from '../../../constants';
import { ResponseSingleIncome } from '../../../incomes/incomes.interface';
import { AccountsService } from '../../../repositories/accounts/services/accounts.service';

@Injectable()
export class IncomesActionsService {
  constructor(
    private incomesService: IncomesService,
    private expensesService: ExpensesService,
    private accountsService: AccountsService,
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
      const { category, amount } = data;

      // 2. Verify category exists
      await this.categoriesService.validateCategoryExists({
        categoryId: category,
      });

      // 3. Verify account exists and it validate belongs to user
      const account = await this.accountsService.findAccountByIdForRecords({
        accountId: data.account,
        userId,
      });
      const { amount: currentAmount } = account;
      const newAmount = currentAmount + amount;

      // 4. Format income
      const dataFormatted = this.formatCreateIncome({ data, userId });

      // 5. Create income
      const incomeCreated = await this.incomesService.createIncome(
        dataFormatted,
      );
      messages.push(INCOME_CREATED_MESSAGE);

      // 6. Update account's amount
      await this.accountsService.modifyAccountBalance({
        amount: newAmount,
        accountId: data.account,
      });
      messages.push("Account's amount updated");

      // 7. Update expenses paid if there are any.
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

      // 8. Return response
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
      if (error.status === 404) throw error;
      if (error.status === 401) throw error;
      throw new BadRequestException(error.message);
    }
  }
}
