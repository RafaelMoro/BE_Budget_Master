import { BadRequestException, Injectable } from '@nestjs/common';
import { CategoriesService } from '../../../categories/services/categories.service';
import { CreateExpenseDto } from '../../../expenses/expenses.dto';
import { ExpensesService } from '../../../expenses/services/expenses.service';
import { isTypeOfRecord } from '../../../utils/isTypeOfRecord';
import {
  EXPENSE_CREATED_MESSAGE,
  MAXIMUM_BUDGETS_LIMIT_ERROR,
  TRANSFER_RECORD_LINKED_BUDGET_ERROR,
} from '../../../expenses/expenses.constants';
import { TYPE_OF_RECORD_INVALID } from '../../../records/constants';
import { changeTimezone } from '../../../utils/changeTimezone';
import { formatDateToString, formatNumberToCurrency } from '../../../utils';
import { Types } from 'mongoose';
import { BudgetsService } from '../../../budgets/services/budgets.service';
import { BudgetHistoryService } from '../../../budget-history/services/budget-history.service';
import { VERSION_RESPONSE } from 'src/constants';
import { ResponseSingleExpense } from 'src/expenses/expenses.interface';

@Injectable()
export class ExpensesActionsService {
  constructor(
    private expensesService: ExpensesService,
    private categoriesService: CategoriesService,
    private budgetService: BudgetsService,
    private budgetHistoryService: BudgetHistoryService,
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
      const dataFormatted = this.formatCreateExpense({
        data,
        categoryId,
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
      throw new BadRequestException(error.message);
    }
  }

  formatCreateExpense({
    data,
    categoryId,
    userId,
  }: {
    data: CreateExpenseDto;
    categoryId: Types.ObjectId;
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
      category: categoryId.toString(),
      amountFormatted,
      userId,
      typeOfRecord,
    };
    return newData;
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
}
