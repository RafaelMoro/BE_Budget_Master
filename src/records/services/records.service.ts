import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { AccountRecord } from '../entities/records.entity';
import { CreateExpense, Expense } from '../../expenses/expenses.entity';
import { CreateIncome, Income } from '../../incomes/incomes.entity';
import { CategoriesService } from '../../categories/services/categories.service';
import { INITIAL_RESPONSE } from '../../constants';
import {
  NO_EXPENSES_FOUND,
  NO_EXPENSES_INCOMES_FOUND,
  NO_INCOMES_FOUND,
  RECORD_CREATED_MESSAGE,
  RECORD_NOT_FOUND,
  RECORD_UNAUTHORIZED_ERROR,
  UNAUTHORIZED_EXPENSES_ERROR,
  UNAUTHORIZED_INCOMES_ERROR,
  TRANSFER_RECORDS_NOT_FOUND,
  TYPE_OF_RECORD_INVALID,
  TRANSFER_ACCOUNT_ERROR,
  MISSING_TRANSFER_RECORD,
} from '../constants';
import {
  JoinRecordsResponse,
  MultipleRecordsResponse,
  BatchRecordsResponse,
  FindTransferRecordsByMonthAndYearProps,
  FindTransferRecordsResponse,
  CreateTransferProps,
  TransferCreated,
} from '../interface';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
} from '../../expenses/expenses.dto';
import { CreateIncomeDto, UpdateIncomeDto } from '../../incomes/incomes.dto';
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
    @InjectModel(AccountRecord.name) private recordModel: Model<AccountRecord>,
    @InjectModel(CreateExpense.name) private expenseModel: Model<CreateExpense>,
    @InjectModel(CreateIncome.name) private incomeModel: Model<CreateIncome>,
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
      const updateTransferExpense = updateExpenseResponse?.data?.expense;
      const updateIncomeResponse = await this.incomesService.updateIncome({
        changes: updatedIncome,
        skipFindCategory: true,
        skipUpdateExpensesPaid: true,
        userId,
      });
      const updateTransferIncome = updateIncomeResponse?.data?.income;

      // Update the prop isPaid to true of the expenses related to this income
      if (income.expensesPaid.length > 0) {
        const expensesIds: CreateExpense[] = (income as CreateIncomeDto)
          .expensesPaid;
        const payload: UpdateExpenseDto[] = expensesIds.map((expense) => ({
          recordId: expense._id,
          isPaid: true,
          userId,
        }));
        await this.expensesService.updateMultipleExpenses(payload);
      }

      let incomePopulated = await this.incomeModel.populate(
        updateTransferIncome,
        {
          path: 'expensesPaid',
          select: '_id shortName amountFormatted fullDate formattedTime',
        },
      );
      incomePopulated = await this.incomeModel.populate(incomePopulated, {
        path: 'category',
        select: '_id categoryName icon',
      });
      const expensePopulated = await this.expenseModel.populate(
        updateTransferExpense,
        {
          path: 'category',
          select: '_id categoryName icon',
        },
      );

      // Validation if any of the transfer records has a missing transfer record
      if (!expensePopulated.transferRecord || !incomePopulated.transferRecord) {
        throw new BadRequestException(MISSING_TRANSFER_RECORD);
      }

      const response: TransferCreated = {
        version: VERSION_RESPONSE,
        success: true,
        message: RECORD_CREATED_MESSAGE,
        data: {
          expense: expensePopulated,
          income: incomePopulated,
        },
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  verifyExpensesBelongsToUser(expenses: Expense[], userId: string) {
    if (expenses.length === 0) return expenses;
    if (expenses[0]?.userId !== userId) {
      throw new UnauthorizedException(UNAUTHORIZED_EXPENSES_ERROR);
    }

    return expenses;
  }

  verifyIncomesBelongsToUser(incomes: Income[], userId: string) {
    if (incomes.length === 0) return incomes;
    if (incomes[0]?.userId !== userId) {
      throw new UnauthorizedException(UNAUTHORIZED_INCOMES_ERROR);
    }
    return incomes;
  }

  async findAllIncomesAndExpensesByMonthAndYear(
    accountId: string,
    month: string,
    year: string,
    userId: string,
  ) {
    try {
      const expensesResponse =
        await this.expensesService.findExpensesByMonthAndYearForRecords({
          accountId,
          month,
          year,
          userId,
        });
      const incomesResponse = await this.incomesService.findIncomesByMonthYear({
        accountId,
        month,
        year,
        userId,
      });

      const { expenses, message: expensesMessage } = expensesResponse;
      const { incomes, message: incomesMessage } = incomesResponse;

      return this.joinIncomesAndExpenses(expenses, incomes);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findTransferRecordsByMonthAndYear({
    month,
    year,
    userId,
    transferId,
  }: FindTransferRecordsByMonthAndYearProps) {
    try {
      const regexDate = `${month}.*${year}|${year}.*${month}`;
      const expenseArray = await this.expenseModel
        .find({
          sub: userId,
          fullDate: { $regex: new RegExp(regexDate, 'i') },
          transferId,
        })
        .populate({ path: 'category', select: 'categoryName icon' })
        .exec();
      const incomeArray = await this.incomeModel
        .find({
          sub: userId,
          fullDate: { $regex: new RegExp(regexDate, 'i') },
          transferId,
        })
        .populate({
          path: 'expensesPaid',
          select: '_id shortName amountFormatted fullDate formattedTime',
        })
        .populate('category', 'categoryName icon')
        .exec();

      if (!expenseArray[0] || !incomeArray[0]) {
        throw new BadRequestException(TRANSFER_RECORDS_NOT_FOUND);
      }

      const [expense] = expenseArray;
      const [income] = incomeArray;
      const response: FindTransferRecordsResponse = {
        ...INITIAL_RESPONSE,
        data: { expense, income },
      };
      return response;
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
   * @deprecated This method is deprecated and will be removed in future versions. Please use the new RecordsServiceV2 class instead.
   */
  async createMultipleRecords(
    data: CreateExpenseDto[] | CreateIncomeDto[],
    isIncome = false,
  ) {
    try {
      const newModels = !isIncome
        ? data.map((account) => {
            return new this.expenseModel(account);
          })
        : data.map((account) => {
            return new this.incomeModel(account);
          });
      const savedModels = await Promise.all(
        newModels.map((account) => account.save()),
      );
      return savedModels;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateMultipleRecords(
    changes: UpdateIncomeDto[] | UpdateExpenseDto[],
    isIncome = false,
  ) {
    try {
      const updatedRecords = await Promise.all(
        changes.map((change) =>
          !isIncome
            ? this.expenseModel.findByIdAndUpdate(
                change.recordId,
                { $set: change },
                { new: true },
              )
            : this.incomeModel.findByIdAndUpdate(
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
      const response: BatchRecordsResponse = {
        ...INITIAL_RESPONSE,
        data: checkUpdatedRecords,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async verifyRecordBelongsUser(
    recordId: string,
    userId: string,
    isIncome: boolean,
  ) {
    try {
      const record = isIncome
        ? await this.incomeModel.findById(recordId)
        : await this.expenseModel.findById(recordId);
      if (!record) throw new UnauthorizedException(RECORD_NOT_FOUND);

      const { userId: recordUserId } = record;
      if (userId !== recordUserId) {
        throw new UnauthorizedException(RECORD_UNAUTHORIZED_ERROR);
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
