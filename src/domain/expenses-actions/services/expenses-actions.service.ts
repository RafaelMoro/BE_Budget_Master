import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { CategoriesService } from '../../../categories/services/categories.service';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
} from '../../../repositories/expenses/expenses.dto';
import { ExpensesService } from '../../../repositories/expenses/services/expenses.service';
import { isTypeOfRecord } from '../../../utils/isTypeOfRecord';
import {
  EXPENSE_DELETED_MESSAGE,
  EXPENSE_UNAUTHORIZED_ERROR,
  MAXIMUM_BUDGETS_LIMIT_ERROR,
  TRANSFER_RECORD_LINKED_BUDGET_ERROR,
} from '../../../repositories/expenses/expenses.constants';
import {
  MISSING_AMOUNT,
  MISSING_CATEGORY,
  MISSING_DATE,
  MISSING_LINKED_BUDGETS,
  TYPE_OF_RECORD_INVALID,
} from '@domain/records/constants';
import { changeTimezone } from '../../../utils/changeTimezone';
import { formatDateToString, formatNumberToCurrency } from '../../../utils';
import { BudgetsService } from '../../../budgets/services/budgets.service';
import { BudgetHistoryService } from '../../../budget-history/services/budget-history.service';
import { INITIAL_RESPONSE, VERSION_RESPONSE } from '../../../constants';
import {
  FindExpensesByMonthYearProps,
  RemoveExpenseProps,
  ResponseMultipleExpenses,
  ResponseSingleExpense,
  UpdateExpenseProps,
} from '../../../repositories/expenses/expenses.interface';
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

      // 2. Verify account exists and belongs to user
      const account = await this.accountsService.findAccountByIdForRecords({
        accountId: data.account,
        userId,
      });

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

      // 7. Return the response
      const response: ResponseSingleExpense = {
        version: VERSION_RESPONSE,
        success: true,
        message: messages,
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
      date: dateWithTimezone,
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
    // Do not format date because it's already formatted when it was created
    const { date, amount } = changes;
    const { fullDate, formattedTime } = formatDateToString(date);
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
          oldArray: oldLinkedBudgetsIds,
          // The type is Budget but in the changes we receive the id as string
          newArray: changes.linkedBudgets as unknown as string[],
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
          messages.push(`Removed budget: ${budgetId}`);

          await this.budgetHistoryService.removeRecordFromBudgetHistory({
            budgetId: new Types.ObjectId(budgetId),
            sub: userId,
            recordToBeDeleted: recordId,
          });
          messages.push(`Deleted from budget history: ${budgetId}`);
        }
      }

      // If there's budgets that this record is part of, add the amount to the current amount of the budget
      if (newBudgetsToAdd.length > 0) {
        // Logic to add record to budget
        for await (const budgetId of newBudgetsToAdd) {
          const { updatedBudget, oldBudget } =
            await this.budgetService.updateBudgetAmount({
              changes: {
                budgetId: new Types.ObjectId(budgetId),
                amountRecord: changes.amount,
              },
              sub: userId,
              expenseOperation: 'addExpense',
            });
          messages.push(`Budget added: ${budgetId}`);

          await this.budgetHistoryService.addRecordToBudgetHistory({
            budgetId: new Types.ObjectId(budgetId),
            sub: userId,
            newRecord: {
              recordId: changes.recordId,
              recordName: changes.shortName,
              recordDate: changes.date,
              recordAmount: changes.amount,
              budgetCurrentAmount: oldBudget.currentAmount,
              budgetUpdatedAmount: updatedBudget.currentAmount,
            },
          });
          messages.push(`Added into budget history: ${budgetId}`);
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
        message: messages,
      };
      return response;
    } catch (error) {
      if (error.status === 404) throw error;
      if (error.status === 401) throw error;
      throw new BadRequestException(error.message);
    }
  }

  async removeExpense({ payload, userId }: RemoveExpenseProps) {
    try {
      const messages: string[] = [];

      // 1. Delete record
      // In the service removeExpense, it validates if the record belongs to the user.
      const { recordId } = payload;
      const recordDeleted = await this.expensesService.removeExpense({
        payload,
        userId,
      });
      const { account: accountId, amount, linkedBudgets } = recordDeleted;
      messages.push(EXPENSE_DELETED_MESSAGE);

      // 2. Update account's amount
      // Validate accounts exists and belong to user.
      const account = await this.accountsService.findAccountByIdForRecords({
        // Does not populate accounts so it's a mongo id as string
        accountId: accountId.toString(),
        userId,
      });
      const { amount: currentAmount } = account;
      const newAmount = currentAmount + amount;
      await this.accountsService.modifyAccountBalance({
        amount: newAmount,
        // Does not populate accounts so it's a mongo id as string
        accountId: accountId.toString(),
      });
      messages.push("Account's amount updated");

      // 3. Update budget's amount and budget history
      if (linkedBudgets.length > 0) {
        for await (const budget of linkedBudgets) {
          await this.budgetService.updateBudgetAmount({
            changes: {
              budgetId: budget._id,
              amountRecord: amount,
            },
            sub: userId,
            expenseOperation: 'removeExpense',
          });
          messages.push(`Removed budget: ${budget}`);

          await this.budgetHistoryService.removeRecordFromBudgetHistory({
            budgetId: budget._id,
            sub: userId,
            recordToBeDeleted: recordId,
          });
          messages.push(`Deleted from budget history: ${budget}`);
        }
      }

      // Return response
      const response: ResponseSingleExpense = {
        ...INITIAL_RESPONSE,
        message: messages,
        data: {
          expense: recordDeleted,
        },
      };
      return response;
    } catch (error) {
      if (error.status === 404) throw error;
      if (error.status === 401) throw error;
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Method used to search for expenses (only record type expense) that are related to an income.
   */
  async findOnlyExpensesByMonthAndYear({
    accountId,
    month,
    year,
    userId,
  }: FindExpensesByMonthYearProps): Promise<ResponseMultipleExpenses> {
    try {
      const { expenses, message } =
        await this.expensesService.findOnlyExpensesByMonthAndYear({
          accountId,
          month,
          year,
          userId,
        });

      const response: ResponseMultipleExpenses = {
        ...INITIAL_RESPONSE,
        message,
        data: { expenses },
      };
      return response;
    } catch (error) {
      if (error.status === 404) throw error;
      throw new BadRequestException(error.message);
    }
  }
}
