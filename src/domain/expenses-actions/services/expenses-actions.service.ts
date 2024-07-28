import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { CategoriesService } from '../../../categories/services/categories.service';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
} from '../../../expenses/expenses.dto';
import { ExpensesService } from '../../../expenses/services/expenses.service';
import { isTypeOfRecord } from '../../../utils/isTypeOfRecord';
import {
  EXPENSE_CREATED_MESSAGE,
  EXPENSE_NOT_FOUND,
  EXPENSE_UNAUTHORIZED_ERROR,
  MAXIMUM_BUDGETS_LIMIT_ERROR,
  TRANSFER_RECORD_LINKED_BUDGET_ERROR,
} from '../../../expenses/expenses.constants';
import {
  MISSING_AMOUNT,
  MISSING_CATEGORY,
  MISSING_DATE,
  MISSING_LINKED_BUDGETS,
  TYPE_OF_RECORD_INVALID,
} from '../../../records/constants';
import { changeTimezone } from '../../../utils/changeTimezone';
import { formatDateToString, formatNumberToCurrency } from '../../../utils';
import { BudgetsService } from '../../../budgets/services/budgets.service';
import { BudgetHistoryService } from '../../../budget-history/services/budget-history.service';
import { INITIAL_RESPONSE, VERSION_RESPONSE } from '../../../constants';
import {
  ResponseSingleExpense,
  UpdateExpenseProps,
} from '../../../expenses/expenses.interface';
import { AccountsService } from '../../../repositories/accounts/services/accounts.service';
import { symmetricDifference } from '../../../utils/symmetricDifference';

@Injectable()
export class ExpensesActionsService {
  constructor(
    private expensesService: ExpensesService,
    private categoriesService: CategoriesService,
    private budgetService: BudgetsService,
    private budgetHistoryService: BudgetHistoryService,
    private accountsService: AccountsService,
  ) {}

  async createExpense({
    data,
    userId,
  }: {
    data: CreateExpenseDto;
    userId: string;
  }) {
    try {
      const messages: string[] = [];
      // 1. Validate data
      const { category, typeOfRecord, date } = data;
      this.validateCreateExpenseData(data);

      // 2. Verify category exists
      await this.categoriesService.validateCategoryExists({
        categoryId: category,
      });

      // 2. Verify account exists
      const account = await this.accountsService.findById(data.account);

      // 3. Format data
      const dataFormatted = this.formatExpenseOnCreate({
        data,
        categoryId: category,
        userId,
      });

      // 4. Create the expense
      const expense = await this.expensesService.createExpense(dataFormatted);
      messages.push('Expense created');

      const { amount: currentAmount } = account;
      const newAmount = currentAmount - data.amount;

      // 5. Update account's amount
      await this.accountsService.modifyAccountBalance({
        amount: newAmount,
        accountId: data.account,
      });
      messages.push('Account updated');

      // 6. Add record to budget history and modify budget's current amount if applies
      if (expense.linkedBudgets?.length > 0 && typeOfRecord === 'expense') {
        for await (const budget of expense.linkedBudgets) {
          await this.budgetService.updateBudgetAmount({
            changes: {
              budgetId: budget._id,
              amountRecord: data.amount,
            },
            sub: userId,
            expenseOperation: 'addExpense',
          });
          messages.push(`Budget updated ${budget._id}`);

          await this.budgetHistoryService.addRecordToBudgetHistory({
            budgetId: budget._id,
            sub: userId,
            newRecord: {
              recordId: expense._id.toString(),
              recordName: expense.shortName,
              recordDate: date,
              recordAmount: expense.amount,
              budgetCurrentAmount: budget.currentAmount,
              budgetUpdatedAmount: budget.currentAmount + expense.amount,
            },
          });
          messages.push(`Budget history updated ${budget._id}`);
        }
      }

      const response: ResponseSingleExpense = {
        version: VERSION_RESPONSE,
        success: true,
        messages,
        data: {
          expense: expense,
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

  formatExpenseOnCreate({
    data,
    categoryId,
    userId,
  }: {
    data: CreateExpenseDto;
    categoryId: string;
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
      category: categoryId,
      amountFormatted,
      userId,
      typeOfRecord,
    };

    return newData;
  }

  formatExpenseOnEdit({
    changes,
    categoryId,
  }: {
    changes: UpdateExpenseDto;
    categoryId: string;
  }) {
    const { date, amount } = changes;
    const dateWithTimezone = changeTimezone(date, 'America/Mexico_City');
    const { fullDate, formattedTime } = formatDateToString(dateWithTimezone);
    const amountFormatted = formatNumberToCurrency(amount);
    const newChanges = {
      ...changes,
      category: categoryId,
      fullDate,
      formattedTime,
      amountFormatted,
    };

    return newChanges;
  }

  validateCreateExpenseData(data: CreateExpenseDto) {
    const { typeOfRecord, linkedBudgets } = data;

    // Validate that records type transfer cannot have linked budgets
    if (linkedBudgets?.length > 0 && typeOfRecord === 'transfer') {
      throw new BadRequestException(TRANSFER_RECORD_LINKED_BUDGET_ERROR);
    }

    // Validate the type of record should be expense or transfer
    if (isTypeOfRecord(typeOfRecord) === false || typeOfRecord !== 'expense') {
      throw new BadRequestException(TYPE_OF_RECORD_INVALID);
    }

    if (linkedBudgets.length > 3) {
      throw new BadRequestException(MAXIMUM_BUDGETS_LIMIT_ERROR);
    }
  }
  validateUpdateExpense({ changes }: { changes: UpdateExpenseDto }) {
    const { category, date, amount, linkedBudgets } = changes;

    if (!date) throw new BadRequestException(MISSING_DATE);
    if (!category) throw new BadRequestException(MISSING_CATEGORY);
    if (!amount) throw new BadRequestException(MISSING_AMOUNT);
    if (!linkedBudgets) throw new BadRequestException(MISSING_LINKED_BUDGETS);
  }

  async updateExpense({ changes, userIdGotten }: UpdateExpenseProps) {
    try {
      // 1. Validate changes
      const messages: string[] = [];
      const { recordId, category } = changes;
      this.validateUpdateExpense({ changes });

      // 2. Verify the expense exist
      const oldExpense = await this.expensesService.findExpenseById(recordId);
      if (!oldExpense) throw new NotFoundException(EXPENSE_NOT_FOUND);

      // 3. Verify the expense belongs to the user
      const { userId } = oldExpense;
      if (userIdGotten !== userId) {
        throw new UnauthorizedException(EXPENSE_UNAUTHORIZED_ERROR);
      }

      // 4. Verify category exists
      await this.categoriesService.validateCategoryExists({
        categoryId: category,
      });

      // 5. Format changes
      const changesFormatted = this.formatExpenseOnEdit({
        changes,
        categoryId: category,
      });

      // 6. Verify if the amount has changed
      const hasChangedAmount = changes.amount !== oldExpense.amount;

      // 7. Verify if the linked budgets has changed
      const oldLinkedBudgetsIds: string[] = oldExpense.linkedBudgets.map(
        (budget) => budget._id.toString(),
      );
      const { oldValues: oldBudgetsToRemove, newValues: newBudgetsToAdd } =
        symmetricDifference({
          // The type is Budget but in the changes we receive the id as string
          oldArray: changes.linkedBudgets as unknown as string[],
          newArray: oldLinkedBudgetsIds,
        });

      // 8. Update budgets amount if there were changes in linked budgets and budget history
      // If there's budgets that this record does not form part of, rest the amount to the current amount of the budget
      if (oldBudgetsToRemove.length > 0) {
        for await (const budgetId of oldBudgetsToRemove) {
          await this.budgetService.updateBudgetAmount({
            changes: {
              budgetId: new Types.ObjectId(budgetId),
              amountRecord: changes.amount,
            },
            sub: userId,
            expenseOperation: 'removeExpense',
          });
          messages.push(`Remove budget ${budgetId}`);
        }
      }

      // If there's budgets that this record is part of, add the amount to the current amount of the budget
      if (newBudgetsToAdd.length > 0) {
        // Logic to add record to budget
        for await (const budgetId of newBudgetsToAdd) {
          await this.budgetService.updateBudgetAmount({
            changes: {
              budgetId: new Types.ObjectId(budgetId),
              amountRecord: changes.amount,
            },
            sub: userId,
            expenseOperation: 'addExpense',
          });
          messages.push(`Added budget ${budgetId}`);
        }
      }

      // 9. Update account's amount if the amount has changed
      if (hasChangedAmount) {
        await this.accountsService.modifyAccountBalanceOnExpense({
          newAmount: changes.amount,
          previousAmount: oldExpense.amount,
          accountId: oldExpense.account.toString(),
        });
        messages.push("Account's amount updated");
      }

      // 10. Update the record
      const updatedRecord = await this.expensesService.updateExpense({
        changes: changesFormatted,
      });
      messages.push('Updated expense');

      // 11. Return the response
      const response: ResponseSingleExpense = {
        ...INITIAL_RESPONSE,
        data: {
          expense: updatedRecord,
        },
        messages,
      };
      return response;
    } catch (error) {
      if (error.status === 404) throw error;
      if (error.status === 401) throw error;
      throw new BadRequestException(error.message);
    }
  }
}
