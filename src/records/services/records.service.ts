import { Injectable, BadRequestException } from '@nestjs/common';

import { Expense } from '../../expenses/expenses.entity';
import { Income } from '../../incomes/incomes.entity';
import { CategoriesService } from '../../categories/services/categories.service';
import { BudgetHistoryService } from '../../budget-history/services/budget-history.service';
import { INITIAL_RESPONSE } from '../../constants';
import {
  NO_EXPENSES_FOUND,
  NO_EXPENSES_INCOMES_FOUND,
  NO_INCOMES_FOUND,
  RECORD_CREATED_MESSAGE,
  TYPE_OF_RECORD_INVALID,
  TRANSFER_ACCOUNT_ERROR,
  MISSING_TRANSFER_RECORD,
} from '../constants';
import {
  JoinRecordsResponse,
  MultipleRecordsResponse,
  CreateTransferProps,
  TransferCreated,
} from '../interface';
import {
  DeleteExpenseDto,
  UpdateExpenseDto,
} from '../../expenses/expenses.dto';
import { UpdateIncomeDto } from '../../incomes/incomes.dto';
import {
  formatDateToString,
  compareDateAndTime,
  formatNumberToCurrency,
} from '../../utils';
import { VERSION_RESPONSE } from '../../constants';
import { isTypeOfRecord } from '../../utils/isTypeOfRecord';
import { changeTimezone } from '../../utils/changeTimezone';
import { ExpensesService } from '../../expenses/services/expenses.service';
import { IncomesService } from '../../incomes/services/incomes.service';

@Injectable()
export class RecordsService {
  constructor(
    private categoriesService: CategoriesService,
    private expensesService: ExpensesService,
    private incomesService: IncomesService,
  ) {}

  async createTransfer({ expense, income, userId }: CreateTransferProps) {
    try {
      const { category, amount, typeOfRecord, date } = expense;
      const dateWithTimezone = changeTimezone(date, 'America/Mexico_City');

      // Validations
      if (
        expense.typeOfRecord !== 'transfer' ||
        income.typeOfRecord !== 'transfer' ||
        isTypeOfRecord(typeOfRecord) === false
      ) {
        throw new BadRequestException(TYPE_OF_RECORD_INVALID);
      }
      if (expense.account === income.account) {
        throw new BadRequestException(TRANSFER_ACCOUNT_ERROR);
      }

      // Get category data
      const {
        data: { categories },
      } = await this.categoriesService.findOrCreateByNameAndUserId({
        categoryName: category,
        userId,
      });
      const [categoryFoundOrCreated] = categories;
      const { _id: categoryId } = categoryFoundOrCreated;

      // Format data
      const { fullDate, formattedTime } = formatDateToString(dateWithTimezone);
      const amountFormatted = formatNumberToCurrency(amount);
      const newDataExpense = {
        ...expense,
        fullDate,
        formattedTime,
        category: categoryId.toString(),
        amountFormatted,
        userId,
        typeOfRecord,
      };
      const newDataIncome = {
        ...income,
        fullDate,
        formattedTime,
        category: categoryId.toString(),
        amountFormatted,
        userId,
        typeOfRecord,
      };

      // Create expense and income
      const { expenseId, accountExpense } =
        await this.expensesService.createTransferExpense(newDataExpense);
      const { incomeId, accountIncome } =
        await this.incomesService.createTransferIncome(newDataIncome);

      // Add transderRecord data to each document.
      const updatedExpense: UpdateExpenseDto = {
        // Transform ObjectIds to string
        recordId: expenseId.toString(),
        date: expense.date,
        category: newDataExpense.category.toString(),
        amount: expense.amount,
        userId,
        transferRecord: {
          transferId: incomeId.toString(),
          account: accountIncome.toString(),
        },
      };
      const updatedIncome: UpdateIncomeDto = {
        recordId: incomeId.toString(),
        date: income.date,
        category: newDataIncome.category.toString(),
        amount: income.amount,
        userId,
        transferRecord: {
          transferId: expenseId.toString(),
          account: accountExpense.toString(),
        },
      };

      const updateExpenseResponse = await this.expensesService.updateExpense({
        changes: updatedExpense,
        skipFindCategory: true,
        userId,
      });
      const updatedTransferExpense = updateExpenseResponse?.data?.expense;
      const updatedIncomeResponse = await this.incomesService.updateIncome({
        changes: updatedIncome,
        skipFindCategory: true,
        skipUpdateExpensesPaid: true,
        userId,
      });
      const updateTransferIncome = updatedIncomeResponse?.data?.income;

      // Update the prop isPaid to true of the expenses related to this income
      if (income.expensesPaid.length > 0) {
        const expensesIds = updateTransferIncome.expensesPaid.map(
          (expense) => expense._id,
        );
        const payload: UpdateExpenseDto[] = expensesIds.map((expense) => ({
          recordId: expense,
          isPaid: true,
          userId,
        }));
        await this.expensesService.updateMultipleExpenses(payload);
      }

      // Validation if any of the transfer records has a missing transfer record
      if (
        !updatedTransferExpense.transferRecord ||
        !updateTransferIncome.transferRecord
      ) {
        throw new BadRequestException(MISSING_TRANSFER_RECORD);
      }

      const response: TransferCreated = {
        version: VERSION_RESPONSE,
        success: true,
        message: RECORD_CREATED_MESSAGE,
        data: {
          expense: updatedTransferExpense,
          income: updateTransferIncome,
        },
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Method used to get all record by month and year.
   */
  async findAllIncomesAndExpensesByMonthAndYear(
    accountId: string,
    month: string,
    year: string,
    userId: string,
  ) {
    try {
      const expenses =
        await this.expensesService.findExpensesByMonthAndYearForRecords({
          accountId,
          month,
          year,
          userId,
        });
      const incomes = await this.incomesService.findIncomesByMonthYear({
        accountId,
        month,
        year,
        userId,
      });

      return this.joinIncomesAndExpenses(expenses, incomes);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  joinIncomesAndExpenses(expenses: Expense[], incomes: Income[]) {
    if (expenses.length === 0 && incomes.length === 0) {
      const noRecordsResponse: MultipleRecordsResponse = {
        ...INITIAL_RESPONSE,
        data: null,
        message: NO_EXPENSES_INCOMES_FOUND,
      };
      return noRecordsResponse;
    }

    if (expenses.length === 0) {
      // No expenses found, return the incomes found.
      const incomesOrdered = incomes.sort(compareDateAndTime);
      const onlyIncomesFoundResponse: MultipleRecordsResponse = {
        ...INITIAL_RESPONSE,
        data: {
          records: incomesOrdered,
        },
        message: NO_EXPENSES_FOUND,
      };
      return onlyIncomesFoundResponse;
    }

    if (incomes.length === 0) {
      // No incomes found, return the expenses found.
      const expensesOrdered = expenses.sort(compareDateAndTime);
      const onlyExpensesFoundResponse: MultipleRecordsResponse = {
        ...INITIAL_RESPONSE,
        data: {
          records: expensesOrdered,
        },
        message: NO_INCOMES_FOUND,
      };
      return onlyExpensesFoundResponse;
    }

    const records = [...expenses, ...incomes].sort(compareDateAndTime);
    const response: JoinRecordsResponse = {
      ...INITIAL_RESPONSE,
      data: {
        records,
      },
    };
    return response;
  }

  // Service to see if the account has any records.
  findAllExpensesByAccount({
    accountId,
    userId,
  }: {
    accountId: string;
    userId: string;
  }) {
    return this.expensesService.findAllExpensesByAccount({ accountId, userId });
  }

  deleteMultipleExpenses({ expenses }: { expenses: DeleteExpenseDto[] }) {
    return this.expensesService.deleteMultipleExpenses(expenses);
  }
}
