import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CategoriesService } from '../../../categories/services/categories.service';
import { CreateIncomeDto, UpdateIncomeDto } from '../../../incomes/incomes.dto';
import { IncomesService } from '../../../incomes/services/incomes.service';
import {
  MISSING_AMOUNT,
  MISSING_CATEGORY,
  MISSING_DATE,
  TYPE_OF_RECORD_INVALID,
} from '../../../records/constants';
import { isTypeOfRecord } from '../../../utils/isTypeOfRecord';
import { changeTimezone } from '../../../utils/changeTimezone';
import { formatDateToString, formatNumberToCurrency } from '../../../utils';
import { UpdateExpensePaidStatusDto } from '../../../expenses/expenses.dto';
import { ExpensesService } from '../../../expenses/services/expenses.service';
import {
  INCOME_CREATED_MESSAGE,
  INCOME_DELETED_MESSAGE,
  UNAUTHORIZED_INCOMES_ERROR,
} from '../../../incomes/incomes.constants';
import { INITIAL_RESPONSE, VERSION_RESPONSE } from '../../../constants';
import {
  RemoveIncomeProps,
  ResponseSingleIncome,
  UpdateIncomeProps,
} from '../../../incomes/incomes.interface';
import { AccountsService } from '../../../repositories/accounts/services/accounts.service';
import { symmetricDifference } from 'src/utils/symmetricDifference';

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

  formatEditIncome({ changes }: { changes: UpdateIncomeDto }) {
    const { date, amount } = changes;
    const dateWithTimezone = changeTimezone(date, 'America/Mexico_City');
    const { fullDate, formattedTime } = formatDateToString(dateWithTimezone);
    const amountFormatted = formatNumberToCurrency(amount);
    const newChanges = {
      ...changes,
      fullDate,
      formattedTime,
      amountFormatted,
    };
    return newChanges;
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

  async updateIncome({ changes, userIdGotten }: UpdateIncomeProps) {
    try {
      const messages: string[] = [];
      const { recordId, category } = changes;
      // 1. Validate changes
      this.validateUpdateIncome({ changes });

      // 2. Verify the expense exist
      const oldIncome = await this.incomesService.findIncomeById(recordId);

      // 3. Verify the income belongs to the user
      const { userId } = oldIncome;
      if (userIdGotten !== userId) {
        throw new UnauthorizedException(UNAUTHORIZED_INCOMES_ERROR);
      }

      // 4. Verify if category exists.
      await this.categoriesService.validateCategoryExists({
        categoryId: category,
      });

      // 5. Format edit income changes
      const incomeChangesFormatted = this.formatEditIncome({ changes });

      // 6. Update income
      const updatedRecord = await this.incomesService.updateIncome({
        changes: incomeChangesFormatted,
      });
      messages.push('Income updated');

      // 7. Verify if the amount has changed
      const hasChangedAmount = changes.amount !== oldIncome.amount;

      // 8. Update account's amount if the amount has changed
      if (hasChangedAmount) {
        await this.accountsService.modifyAccountBalanceOnIncome({
          newAmount: changes.amount,
          previousAmount: oldIncome.amount,
          accountId: oldIncome.account.toString(),
        });
        messages.push("Account's amount updated");
      }

      // 9. Verify if the expensesPaids has changed
      const oldExpensesPaid: string[] = oldIncome.expensesPaid.map((expense) =>
        expense._id.toString(),
      );
      const { oldValues: oldExpensesToRemove, newValues: newExpensesToAdd } =
        symmetricDifference({
          oldArray: oldExpensesPaid,
          // The type is CreateExpense but in the changes we receive the id as string
          newArray: changes.expensesPaid as unknown as string[],
        });

      // 10. Update paid status of old expenses if exists
      if (oldExpensesToRemove.length > 0) {
        const payloadOldExpenses: UpdateExpensePaidStatusDto[] =
          oldExpensesPaid.map((expenseId) => ({
            recordId: expenseId,
            paidStatus: false,
          }));
        await this.expensesService.updateMultipleExpensesPaidStatus(
          payloadOldExpenses,
        );
        messages.push(
          `Old expenses paid status updated: ${payloadOldExpenses.length}`,
        );
      }

      // 11. Update paid status of new expenses if exists
      if (newExpensesToAdd.length > 0) {
        const payloadNewExpenses: UpdateExpensePaidStatusDto[] =
          newExpensesToAdd.map((expenseId) => ({
            recordId: expenseId,
            paidStatus: true,
          }));
        await this.expensesService.updateMultipleExpensesPaidStatus(
          payloadNewExpenses,
        );
        messages.push(
          `New expenses paid status updated: ${payloadNewExpenses.length}`,
        );
      }

      // 12. Return response
      const response: ResponseSingleIncome = {
        ...INITIAL_RESPONSE,
        message: messages,
        data: {
          income: updatedRecord,
        },
      };
      return response;
    } catch (error) {
      if (error.status === 404) throw error;
      if (error.status === 401) throw error;
      throw new BadRequestException(error.message);
    }
  }

  validateUpdateIncome({ changes }: { changes: UpdateIncomeDto }) {
    const { category, date, amount } = changes;

    if (!date) throw new BadRequestException(MISSING_DATE);
    if (!category) throw new BadRequestException(MISSING_CATEGORY);
    if (!amount) throw new BadRequestException(MISSING_AMOUNT);
  }

  async removeIncome({ payload, userId }: RemoveIncomeProps) {
    try {
      const messages: string[] = [];

      // 1. Delete income
      const incomeDeleted = await this.incomesService.removeIncome({
        payload,
        userId,
      });
      messages.push(INCOME_DELETED_MESSAGE);

      // 2. Update account's amount.

      // 2. Check if there are any expenses related to this income and change their status
      if (incomeDeleted?.expensesPaid?.length > 0) {
        // set expenses as not paid
        const payloadExpensesPaid: UpdateExpensePaidStatusDto[] =
          incomeDeleted?.expensesPaid.map((expense) => ({
            recordId: expense._id,
            paidStatus: false,
          }));
        await this.expensesService.updateMultipleExpensesPaidStatus(
          payloadExpensesPaid,
        );
        messages.push(`Expenses paid updated: ${payloadExpensesPaid.length}`);
      }

      // 3. Return response
      const response: ResponseSingleIncome = {
        ...INITIAL_RESPONSE,
        message: messages,
        data: {
          income: incomeDeleted,
        },
      };
      return response;
    } catch (error) {
      if (error.status === 404) throw error;
      if (error.status === 401) throw error;
      throw new BadRequestException(error.message);
    }
  }
}
