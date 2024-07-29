import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateIncome, Income } from '../incomes.entity';
import { CategoriesService } from '../../categories/services/categories.service';
import {
  CreateIncomeDto,
  DeleteIncomeDto,
  UpdateIncomeDto,
} from '../incomes.dto';
import {
  MISSING_AMOUNT,
  MISSING_CATEGORY,
  MISSING_DATE,
} from '../../records/constants';
import { changeTimezone } from '../../utils/changeTimezone';
import { formatDateToString, formatNumberToCurrency } from '../../utils';
import { CreateExpense } from '../../expenses/expenses.entity';
import { UpdateExpenseDto } from '../../expenses/expenses.dto';
import {
  BatchIncomesResponse,
  DeleteMultipleIncomesResponse,
  FindAllIncomesByAccountResponse,
  FindIncomesByMonthYearProps,
  RemoveIncomeProps,
  ResponseSingleIncome,
  UpdateIncomeProps,
} from '../incomes.interface';
import { INITIAL_RESPONSE } from '../../constants';
import {
  INCOME_DELETED_MESSAGE,
  INCOME_NOT_FOUND,
  INCOME_UNAUTHORIZED_ERROR,
  INCOMES_NOT_FOUND,
  UNAUTHORIZED_INCOMES_ERROR,
} from '../incomes.constants';
import { ExpensesService } from '../../expenses/services/expenses.service';
import { getMonthNumber } from '../../utils/getMonthNumber';
import { EXPENSE_NOT_FOUND } from 'src/expenses/expenses.constants';

@Injectable()
export class IncomesService {
  constructor(
    @InjectModel(CreateIncome.name) private incomeModel: Model<CreateIncome>,
    private categoriesService: CategoriesService,
    private expensesService: ExpensesService,
  ) {}

  async createIncome(data: CreateIncomeDto) {
    try {
      const model = new this.incomeModel(data);
      const modelSaved: Income = await model.save();
      return modelSaved;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createTransferIncome(data: CreateIncomeDto) {
    try {
      const model = new this.incomeModel(data);
      const modelSaved: Income = await model.save();
      const { _id: incomeId, account: accountIncome } = modelSaved;
      return { incomeId, accountIncome };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Method to get the income to modify and validate if exists.
   * This method is used by incomes actions service
   */
  async findIncomeById(incomeId: string) {
    try {
      const income: Income = await this.incomeModel.findById(incomeId).exec();
      if (!income) throw new NotFoundException(EXPENSE_NOT_FOUND);
      return income;
    } catch (error) {
      if (error.status === 404) throw error;
      if (error.status === 401) throw error;
      throw new BadRequestException(error.message);
    }
  }

  async updateIncome({
    changes,
  }: // userId,
  // skipFindCategory = false,
  // skipUpdateExpensesPaid = false,
  {
    changes: UpdateIncomeDto;
  }) {
    try {
      const { recordId } = changes;
      const updatedRecord: Income = await this.incomeModel
        .findByIdAndUpdate(recordId, { $set: changes }, { new: true })
        .populate({
          path: 'expensesPaid',
          select: '_id shortName amountFormatted fullDate formattedTime',
        })
        .populate({
          path: 'category',
          select: '_id categoryName icon',
        })
        .exec();

      if (!updatedRecord) throw new BadRequestException(INCOME_NOT_FOUND);
      return updatedRecord;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async verifyRecordBelongsUser(recordId: string, userId: string) {
    try {
      const record = await this.incomeModel.findById(recordId);
      if (!record) throw new UnauthorizedException(INCOME_NOT_FOUND);

      const { userId: recordUserId } = record;
      if (userId !== recordUserId) {
        throw new UnauthorizedException(INCOME_UNAUTHORIZED_ERROR);
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async removeIncome({ payload, userId }: RemoveIncomeProps) {
    try {
      const { recordId } = payload;
      await this.verifyRecordBelongsUser(recordId, userId);

      const income = await this.incomeModel.findById(recordId);

      // Check if there are any expenses related to this income
      if (income?.expensesPaid?.length > 0) {
        // set expenses as not paid
        const payload: UpdateExpenseDto[] = income.expensesPaid.map(
          (expense) => ({
            recordId: expense._id,
            isPaid: false,
            userId,
          }),
        );
        await this.expensesService.updateMultipleExpenses(payload);
      }

      const recordDeleted: Income = await this.incomeModel.findByIdAndDelete(
        recordId,
      );
      if (!recordDeleted) throw new BadRequestException(INCOME_NOT_FOUND);

      const response: ResponseSingleIncome = {
        ...INITIAL_RESPONSE,
        message: [INCOME_DELETED_MESSAGE],
        data: {
          income: recordDeleted,
        },
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

  verifyIncomesBelongsToUser(incomes: Income[], userId: string) {
    if (incomes.length === 0) return incomes;
    if (incomes[0]?.userId !== userId) {
      throw new UnauthorizedException(UNAUTHORIZED_INCOMES_ERROR);
    }
    return incomes;
  }

  /**
   * Method to get all incomes (incomes and transfer) by month, year, account and user Id.
   * This method is used by the records service to get all incomes and expenses by month and year.
   */
  async findIncomesByMonthYear({
    accountId,
    userId,
    month,
    year,
  }: FindIncomesByMonthYearProps): Promise<Income[]> {
    try {
      const monthNumber = getMonthNumber(month);
      const yearNumber = Number(year);

      const startDate = new Date(yearNumber, monthNumber, 1);
      const endDate = new Date(yearNumber, monthNumber + 1, 1);

      const incomes: Income[] = await this.incomeModel
        .aggregate([
          {
            $match: {
              date: {
                $gte: startDate,
                $lt: endDate,
              },
              userId,
              account: accountId,
            },
          },
        ])
        .exec();

      this.verifyIncomesBelongsToUser(incomes, userId);
      if (incomes.length === 0) {
        return incomes;
      }

      let incomesPopulated: Income[];
      incomesPopulated = await this.incomeModel.populate(incomes, {
        path: 'expensesPaid',
        select: '_id shortName amountFormatted fullDate formattedTime',
      });
      incomesPopulated = await this.incomeModel.populate(incomesPopulated, {
        path: 'category',
        select: '_id categoryName icon',
      });

      return incomesPopulated;
    } catch (error) {
      if (error.status === 404) throw error;
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Method to get all incomes by account.
   * This method is used by the accounts service when deleting an account.
   */
  async findAllIncomesByAccount({
    accountId,
    userId,
  }: {
    accountId: string;
    userId: string;
  }): Promise<FindAllIncomesByAccountResponse> {
    try {
      const incomes: Income[] = await this.incomeModel
        .aggregate([
          {
            $match: {
              userId,
              account: accountId,
            },
          },
        ])
        .exec();

      this.verifyIncomesBelongsToUser(incomes, userId);
      if (incomes.length === 0) {
        return {
          incomes,
          message: INCOMES_NOT_FOUND,
        };
      }

      return {
        incomes,
        message: null,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /**
   * Method to delete all incomes given an array of income Ids.
   * This method is used by the accounts service when deleting an account.
   */
  async deleteMultipleIncomes(
    records: DeleteIncomeDto[],
  ): Promise<DeleteMultipleIncomesResponse> {
    try {
      const incomesIds = records.map((record) => record.recordId);
      const deletedRecords: Income[] = await Promise.all(
        incomesIds.map((id) => this.incomeModel.findByIdAndDelete(id)),
      );
      const checkDeletedRecords = deletedRecords.map(
        (record: Income, index: number) => {
          if (!record) return `record id ${records[index].recordId} not found`;
          return record;
        },
      );

      return {
        incomes: checkDeletedRecords,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
