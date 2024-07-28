import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CategoriesService } from '../../../categories/services/categories.service';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
} from '../../../expenses/expenses.dto';
import { ExpensesService } from '../../../expenses/services/expenses.service';
import { isTypeOfRecord } from '../../../utils/isTypeOfRecord';
import {
  EXPENSE_CREATED_MESSAGE,
  EXPENSE_UNAUTHORIZED_ERROR,
  MAXIMUM_BUDGETS_LIMIT_ERROR,
  TRANSFER_RECORD_LINKED_BUDGET_ERROR,
} from '../../../expenses/expenses.constants';
import {
  MISSING_AMOUNT,
  MISSING_CATEGORY,
  MISSING_DATE,
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
      const { category, typeOfRecord, date } = data;
      this.validateCreateExpenseData(data);

      const categoryId =
        await this.categoriesService.findOrCreateCategoriesByNameAndUserIdForRecords(
          {
            categoryName: category,
            userId,
          },
        );
      const dataFormatted = this.formatExpenseOnCreate({
        data,
        categoryId: categoryId.toString(),
        userId,
      });
      const expense = await this.expensesService.createExpense(dataFormatted);

      // Add record to budget history and modify budget current amount
      if (expense.linkedBudgets?.length > 0 && typeOfRecord === 'expense') {
        for await (const budget of expense.linkedBudgets) {
          await this.budgetService.updateBudgetAmount({
            changes: {
              budgetId: budget._id,
              amountRecord: data.amount,
            },
            sub: userId,
          });

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
        }
      }

      const response: ResponseSingleExpense = {
        version: VERSION_RESPONSE,
        success: true,
        message: EXPENSE_CREATED_MESSAGE,
        data: {
          expense: expense,
        },
        error: null,
      };
      return response;
    } catch (error) {
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
    const { category, date, amount } = changes;

    if (!date) throw new UnauthorizedException(MISSING_DATE);
    if (!category) throw new UnauthorizedException(MISSING_CATEGORY);
    if (!amount) throw new UnauthorizedException(MISSING_AMOUNT);
  }

  async updateExpense({
    changes,
    userIdGotten,
    skipFindCategory = false,
  }: UpdateExpenseProps) {
    try {
      const { recordId, category } = changes;
      this.validateUpdateExpense({ changes });

      const oldExpense = await this.expensesService.findExpenseById(recordId);
      const { userId } = oldExpense;
      if (userIdGotten !== userId) {
        throw new UnauthorizedException(EXPENSE_UNAUTHORIZED_ERROR);
      }

      let categoryId = category;
      // Used in create transfer in records service
      if (!skipFindCategory) {
        const categoryIdFetched =
          await this.categoriesService.findOrCreateCategoriesByNameAndUserIdForRecords(
            {
              categoryName: category,
              userId,
            },
          );
        categoryId = categoryIdFetched.toString();
      }

      const changesFormatted = this.formatExpenseOnEdit({
        changes,
        categoryId,
      });

      const hasChangedAmount = changes.amount !== oldExpense.amount;

      // Update amount account if the amount has changed
      if (hasChangedAmount) {
        await this.accountsService.modifyAccountBalanceOnExpense({
          newAmount: changes.amount,
          previousAmount: oldExpense.amount,
          accountId: oldExpense.account.toString(),
        });
      }

      const updatedRecord = await this.expensesService.updateExpense({
        changes: changesFormatted,
      });

      /** Return response */
      const response: ResponseSingleExpense = {
        ...INITIAL_RESPONSE,
        data: {
          expense: updatedRecord,
        },
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
