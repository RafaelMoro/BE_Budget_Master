import { Injectable, BadRequestException } from '@nestjs/common';

import { Expense } from '../../expenses/expenses.entity';
import { Income } from '../../incomes/incomes.entity';
import { CategoriesService } from '../../categories/services/categories.service';
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
  CreateExpenseDto,
  DeleteExpenseDto,
  UpdateExpenseDto,
} from '../../expenses/expenses.dto';
import {
  CreateIncomeDto,
  DeleteIncomeDto,
  UpdateIncomeDto,
} from '../../incomes/incomes.dto';
import {
  formatDateToString,
  compareDateAndTime,
  formatNumberToCurrency,
} from '../../utils';
import { VERSION_RESPONSE } from '../../constants';
import { changeTimezone } from '../../utils/changeTimezone';
import { ExpensesService } from '../../expenses/services/expenses.service';
import { IncomesService } from '../../incomes/services/incomes.service';
import { AccountsService } from '../../repositories/accounts/services/accounts.service';

@Injectable()
export class RecordsService {
  constructor(
    private categoriesService: CategoriesService,
    private accountsService: AccountsService,
    private expensesService: ExpensesService,
    private incomesService: IncomesService,
  ) {}

  async createTransfer({ expense, income, userId }: CreateTransferProps) {
    try {
      const { category } = expense;

      // 1. Validate data:
      // Expense and income values are the same: amount, date, shortName, category, subCategory
      // Validate accounts are different
      this.validateTransferData({ expense, income });

      // 2. Validate category exists
      await this.categoriesService.validateCategoryExists({
        categoryId: category,
      });

      // 3. Validate accounts exist
      const expenseAccount =
        await this.accountsService.findAccountByIdForRecords({
          accountId: expense.account,
          userId,
        });
      const incomeAccount =
        await this.accountsService.findAccountByIdForRecords({
          accountId: income.account,
          userId,
        });

      // 4. Format new income and expense
      const { expenseFormatted, incomeFormatted } = this.formatTransferRecords({
        expense,
        income,
        userId,
      });

      // 5. Create expense and income
      const { expenseId, accountExpense } =
        await this.expensesService.createTransferExpense(expenseFormatted);
      const { incomeId, accountIncome } =
        await this.incomesService.createTransferIncome(incomeFormatted);

      // Add transderRecord data to each document.
      const updatedExpense: UpdateExpenseDto = {
        // Transform ObjectIds to string
        recordId: expenseId.toString(),
        date: expense.date,
        category,
        amount: expense.amount,
        // userId,
        transferRecord: {
          transferId: incomeId.toString(),
          account: accountIncome.toString(),
        },
      };
      const updatedIncome: UpdateIncomeDto = {
        recordId: incomeId.toString(),
        date: income.date,
        category,
        amount: income.amount,
        // userId,
        transferRecord: {
          transferId: expenseId.toString(),
          account: accountExpense.toString(),
        },
      };

      const updatedTransferExpense = await this.expensesService.updateExpense({
        changes: updatedExpense,
        // skipFindCategory: true,
        // userId,
      });
      const updateTransferIncome = await this.incomesService.updateIncome({
        changes: updatedIncome,
        // skipFindCategory: true,
        // skipUpdateExpensesPaid: true,
        // userId,
      });

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
   * Method that validates data and ensure expense and income has same data.
   * Expense and income values are the same: amount, date, shortName, category, subCategory
   * Validate accounts are different
   */
  validateTransferData({
    expense,
    income,
  }: {
    expense: CreateExpenseDto;
    income: CreateIncomeDto;
  }) {
    if (
      expense.typeOfRecord !== 'transfer' ||
      income.typeOfRecord !== 'transfer'
    ) {
      throw new BadRequestException(TYPE_OF_RECORD_INVALID);
    }

    if (!expense.isPaid) {
      throw new BadRequestException(
        'The expense transfer record must have value isPaid as true',
      );
    }

    // Validate income and expense has same value on the following fields.
    if (expense.account === income.account) {
      throw new BadRequestException(TRANSFER_ACCOUNT_ERROR);
    }
    if (expense.shortName !== income.shortName) {
      throw new BadRequestException(
        'Transfer records has different short name. Both must have the same value',
      );
    }
    if (expense.amount !== income.amount) {
      throw new BadRequestException(
        'Transfer records has different amounts. Both must have the same value',
      );
    }
    if (expense.date !== income.date) {
      throw new BadRequestException(
        'Transfer records has different dates. Both must have the same value',
      );
    }
    if (expense.category !== income.category) {
      throw new BadRequestException(
        'Transfer records has different category. Both must have the same value',
      );
    }
    if (expense.subCategory !== income.subCategory) {
      throw new BadRequestException(
        'Transfer records has different subCategory. Both must have the same value',
      );
    }
  }

  formatTransferRecords({
    expense,
    income,
    userId,
  }: {
    expense: CreateExpenseDto;
    income: CreateIncomeDto;
    userId: string;
  }) {
    // It has been validated with method validateTransferData that expense and income has same date, amount
    const { amount, date } = expense;
    const dateWithTimezone = changeTimezone(date, 'America/Mexico_City');

    const { fullDate, formattedTime } = formatDateToString(dateWithTimezone);
    const amountFormatted = formatNumberToCurrency(amount);

    const newDataExpense = {
      ...expense,
      fullDate,
      formattedTime,
      amountFormatted,
      userId,
    };
    const newDataIncome = {
      ...income,
      fullDate,
      formattedTime,
      amountFormatted,
      userId,
    };

    return {
      expenseFormatted: newDataExpense,
      incomeFormatted: newDataIncome,
    };
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

  /**
   * Service to see if the account has any expenses before deleting account in account service
   */
  findAllExpensesByAccount({
    accountId,
    userId,
  }: {
    accountId: string;
    userId: string;
  }) {
    return this.expensesService.findAllExpensesByAccount({ accountId, userId });
  }

  /**
   * Service to see if the account has any incomes before deleting account in account service
   */
  findAllIncomesByAccount({
    accountId,
    userId,
  }: {
    accountId: string;
    userId: string;
  }) {
    return this.incomesService.findAllIncomesByAccount({ accountId, userId });
  }

  /**
   * Service to delete the expenses related to an account to be deleted
   */
  deleteMultipleExpenses({ expenses }: { expenses: DeleteExpenseDto[] }) {
    return this.expensesService.deleteMultipleExpenses(expenses);
  }

  /**
   * Service to delete the incomes related to an account to be deleted
   */
  deleteMultipleIncomes({ incomes }: { incomes: DeleteIncomeDto[] }) {
    return this.incomesService.deleteMultipleIncomes(incomes);
  }
}
