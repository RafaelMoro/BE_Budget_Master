import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import { AccountRecord } from '../entities/records.entity';
import { CreateExpense, Expense } from '../entities/expenses.entity';
import { CreateIncome, Income } from '../entities/incomes.entity';
import { CategoriesService } from '../../categories/services/categories.service';
import { INITIAL_RESPONSE } from '../../constants';
import {
  EXPENSE_NOT_FOUND,
  INCOME_NOT_FOUND,
  NO_EXPENSES_FOUND,
  NO_EXPENSES_INCOMES_FOUND,
  NO_INCOMES_FOUND,
  RECORD_CREATED_MESSAGE,
  RECORD_NOT_FOUND,
  RECORD_UNAUTHORIZED_ERROR,
  UNAUTHORIZED_EXPENSES_ERROR,
  UNAUTHORIZED_INCOMES_ERROR,
  MISSING_DATE,
  MISSING_CATEGORY,
  MISSING_AMOUNT,
  RECORD_DELETED,
  TRANSFER_RECORDS_NOT_FOUND,
  TYPE_OF_RECORD_INVALID,
  TRANSFER_ACCOUNT_ERROR,
  MISSING_TRANSFER_RECORD,
} from '../constants';
import {
  FindRecordsByAccountProps,
  RemoveRecordProps,
  RecordCreated,
  JoinRecordsResponse,
  MultipleRecordsResponse,
  BatchRecordsResponse,
  FindTransferRecordsByMonthAndYearProps,
  FindTransferRecordsResponse,
  CreateTransferProps,
  TransferCreated,
  UpdateRecordProps,
  UpdateRecordResponse,
} from '../interface';
import { DeleteRecordDto } from '../dtos/records.dto';
import { CreateExpenseDto, UpdateExpenseDto } from '../dtos/expenses.dto';
import { CreateIncomeDto, UpdateIncomeDto } from '../dtos/incomes.dto';
import {
  formatDateToString,
  compareDateAndTime,
  formatNumberToCurrency,
} from '../../utils';
import { VERSION_RESPONSE } from '../../constants';
import { GeneralResponse } from '../../response.interface';
import { isTypeOfRecord } from '../../utils/isTypeOfRecord';
import { changeTimezone } from 'src/utils/changeTimezone';

@Injectable()
export class RecordsService {
  constructor(
    @InjectModel(AccountRecord.name) private recordModel: Model<AccountRecord>,
    @InjectModel(CreateExpense.name) private expenseModel: Model<CreateExpense>,
    @InjectModel(CreateIncome.name) private incomeModel: Model<CreateIncome>,
    private categoriesService: CategoriesService,
  ) {}

  async createOneRecord(
    data: CreateExpenseDto | CreateIncomeDto,
    isIncome = false,
    userId: string,
  ) {
    try {
      const { category, amount, typeOfRecord, date } = data;
      console.log('date', date);
      const dateWithTimezone = changeTimezone(date, 'America/Mexico_City');
      console.log('dateWithTimezone', dateWithTimezone);
      if (
        isTypeOfRecord(typeOfRecord) === false ||
        typeOfRecord === 'transfer' ||
        // Validate if the record is an expense and type of record has value income
        (!isIncome && typeOfRecord === 'income') ||
        // Validate if the record is an income and type of record has value expense
        (isIncome && typeOfRecord === 'expense')
      ) {
        throw new BadRequestException(TYPE_OF_RECORD_INVALID);
      }

      const {
        data: { categories },
      } = await this.categoriesService.findByNameAndUserId({
        categoryName: category,
        userId,
      });
      const [categoryFoundOrCreated] = categories;
      const { _id: categoryId } = categoryFoundOrCreated;
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
      const model = !isIncome
        ? new this.expenseModel(newData)
        : new this.incomeModel(newData);
      const modelSaved: Expense | Income = await model.save();
      let modelPopulated: Expense | Income;

      // Update the prop isPaid to true of the expenses related to this income
      if (isIncome) {
        const expensesIds: CreateExpense[] = (data as CreateIncomeDto)
          .expensesPaid;
        const payload: UpdateExpenseDto[] = expensesIds.map((id) => ({
          recordId: id,
          isPaid: true,
          userId,
        }));
        await this.updateMultipleRecords(payload);

        modelPopulated = await this.incomeModel.populate(modelSaved, {
          path: 'expensesPaid',
          select: '_id shortName amountFormatted fullDate formattedTime',
        });
        modelPopulated = await this.incomeModel.populate(modelPopulated, {
          path: 'category',
          select: '_id categoryName icon',
        });
      } else {
        modelPopulated = await this.expenseModel.populate(modelSaved, {
          path: 'category',
          select: '_id categoryName icon',
        });
      }

      const response: RecordCreated = {
        version: VERSION_RESPONSE,
        success: true,
        message: RECORD_CREATED_MESSAGE,
        data: {
          record: modelPopulated,
        },
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

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

      const {
        data: { categories },
      } = await this.categoriesService.findByNameAndUserId({
        categoryName: category,
        userId,
      });
      const [categoryFoundOrCreated] = categories;
      const { _id: categoryId } = categoryFoundOrCreated;
      const { fullDate, formattedTime } = formatDateToString(dateWithTimezone);
      const amountFormatted = formatNumberToCurrency(amount);
      const newDataExpense = {
        ...expense,
        date: dateWithTimezone,
        fullDate,
        formattedTime,
        category: categoryId,
        amountFormatted,
        userId,
        typeOfRecord,
      };
      const newDataIncome = {
        ...income,
        date: dateWithTimezone,
        fullDate,
        formattedTime,
        category: categoryId,
        amountFormatted,
        userId,
        typeOfRecord,
      };
      const expenseModel = new this.expenseModel(newDataExpense);
      const incomeModel = new this.incomeModel(newDataIncome);

      const expenseSaved: Expense = await expenseModel.save();
      const incomeSaved: Income = await incomeModel.save();
      const { _id: expenseId, account: accountExpense } = expenseSaved;
      const { _id: incomeId, account: accountIncome } = incomeSaved;

      // Add transderRecord data to each document.
      const updatedExpense = {
        // Transform ObjectIds to string
        recordId: expenseId.toString(),
        date: dateWithTimezone,
        fullDate,
        formattedTime,
        category: newDataExpense.category.toString(),
        amount: expense.amount,
        userId,
        transferRecord: {
          transferId: incomeId.toString(),
          account: accountIncome.toString(),
        },
      };
      const updatedIncome = {
        recordId: incomeId.toString(),
        date: dateWithTimezone,
        fullDate,
        formattedTime,
        category: newDataIncome.category.toString(),
        amount: income.amount,
        userId,
        transferRecord: {
          transferId: expenseId.toString(),
          account: accountExpense.toString(),
        },
      };
      const updateExpenseResponse = await this.updateRecord({
        changes: updatedExpense,
        skipFindCategory: true,
        userId,
      });
      const updateTransferExpense = updateExpenseResponse?.data?.record;
      const updateIncomeResponse = await this.updateRecord({
        changes: updatedIncome,
        isIncome: true,
        skipFindCategory: true,
        skipUpdateExpensesPaid: true,
        userId,
      });
      const updateTransferIncome = updateIncomeResponse?.data?.record;

      // Update the prop isPaid to true of the expenses related to this income
      if (income.expensesPaid.length > 0) {
        const expensesIds: CreateExpense[] = (income as CreateIncomeDto)
          .expensesPaid;
        const payload: UpdateExpenseDto[] = expensesIds.map((id) => ({
          recordId: id,
          isPaid: true,
          userId,
        }));
        await this.updateMultipleRecords(payload);
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

  /** Service used for searching incomes or expenses by account. */
  async findRecordsByAccount({
    accountId,
    isIncome = false,
    userId,
  }: FindRecordsByAccountProps): Promise<MultipleRecordsResponse> {
    try {
      const records = !isIncome
        ? await this.expenseModel
            .find({ account: accountId })
            .populate('category', 'categoryName')
            .exec()
        : await this.incomeModel
            .find({ account: accountId })
            .populate({
              path: 'expensesPaid',
              select: '_id shortName amountFormatted fullDate formattedTime',
            })
            .populate('category', 'categoryName')
            .exec();

      if (isIncome) {
        this.verifyIncomesBelongsToUser(records as Income[], userId);
      } else {
        this.verifyExpensesBelongsToUser(records as Expense[], userId);
      }

      if (records.length === 0) {
        // returning a message because this service is used when an account is deleted. If no records are found and an exception is throwed,
        // it would break the service to delete an account with no records.
        const message = !isIncome ? EXPENSE_NOT_FOUND : INCOME_NOT_FOUND;
        const emptyRecordsResponse: MultipleRecordsResponse = {
          ...INITIAL_RESPONSE,
          data: null,
          message,
        };
        return emptyRecordsResponse;
      }

      const response: MultipleRecordsResponse = {
        ...INITIAL_RESPONSE,
        data: {
          records,
        },
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

  async findAllIncomesAndExpenses(accountId: string) {
    try {
      const expenses = await this.expenseModel
        .find({
          account: accountId,
        })
        .populate('category', 'categoryName icon')
        .exec();
      const incomes = await this.incomeModel
        .find({
          account: accountId,
        })
        .populate({
          path: 'expensesPaid',
          select: '_id shortName amountFormatted fullDate formattedTime',
        })
        .populate('category', 'categoryName')
        .exec();

      return this.joinIncomesAndExpenses(expenses, incomes);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // This service is used to search for expenses to be related to an income.
  async findAllExpensesByMonthAndYear(
    accountId: string,
    month: string,
    year: string,
    userId: string,
  ): Promise<GeneralResponse> {
    try {
      const regexDate = `${month}.*${year}|${year}.*${month}`;
      const expenses: Expense[] = await this.expenseModel
        .find({
          account: accountId,
          fullDate: { $regex: new RegExp(regexDate, 'i') },
        })
        .populate({ path: 'category', select: 'categoryName icon' })
        .exec();

      this.verifyExpensesBelongsToUser(expenses, userId);
      if (expenses.length === 0) {
        const noExpensesResponse: GeneralResponse = {
          ...INITIAL_RESPONSE,
          message: NO_EXPENSES_FOUND,
          data: null,
        };
        return noExpensesResponse;
      }

      const response: MultipleRecordsResponse = {
        ...INITIAL_RESPONSE,
        data: { records: expenses },
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAllIncomesAndExpensesByMonthAndYear(
    accountId: string,
    month: string,
    year: string,
    userId: string,
  ) {
    try {
      const regexDate = `${month}.*${year}|${year}.*${month}`;
      const expenses = await this.expenseModel
        .find({
          account: accountId,
          fullDate: { $regex: new RegExp(regexDate, 'i') },
        })
        .populate({ path: 'category', select: 'categoryName icon' })
        .exec();
      const incomes = await this.incomeModel
        .find({
          account: accountId,
          fullDate: { $regex: new RegExp(month, 'i') },
        })
        .populate({
          path: 'expensesPaid',
          select: '_id shortName amountFormatted fullDate formattedTime',
        })
        .populate('category', 'categoryName icon')
        .exec();

      this.verifyExpensesBelongsToUser(expenses, userId);
      this.verifyIncomesBelongsToUser(incomes, userId);

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

  // Deprecated
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

  async updateRecord({
    changes,
    userId,
    isIncome = false,
    skipFindCategory = false,
    skipUpdateExpensesPaid = false,
  }: UpdateRecordProps) {
    try {
      const {
        recordId,
        category,
        date,
        amount,
        userId: userIdChanges,
      } = changes;

      // Verify that the record belongs to the user
      if (userId !== userIdChanges) {
        throw new UnauthorizedException(RECORD_UNAUTHORIZED_ERROR);
      }
      if (!date) throw new UnauthorizedException(MISSING_DATE);
      if (!category) throw new UnauthorizedException(MISSING_CATEGORY);
      if (!amount) throw new UnauthorizedException(MISSING_AMOUNT);

      const dateWithTimezone = changeTimezone(date, 'America/Mexico_City');

      let categoryId = category;
      if (!skipFindCategory) {
        const {
          data: { categories },
        } = await this.categoriesService.findByNameAndUserId({
          categoryName: category,
          userId,
        });
        const [categoryFoundOrCreated] = categories;
        const { _id } = categoryFoundOrCreated;
        categoryId = _id.toString();
      }
      const { fullDate, formattedTime } = formatDateToString(dateWithTimezone);
      const amountFormatted = formatNumberToCurrency(amount);
      const newChanges = {
        ...changes,
        date: dateWithTimezone,
        category: categoryId,
        fullDate,
        formattedTime,
        amountFormatted,
      };
      const updatedRecord: Income | Expense = !isIncome
        ? await this.expenseModel
            .findByIdAndUpdate(recordId, { $set: newChanges }, { new: true })
            .exec()
        : await this.incomeModel
            .findByIdAndUpdate(recordId, { $set: newChanges }, { new: true })
            .populate({
              path: 'expensesPaid',
              select: '_id shortName amountFormatted fullDate formattedTime',
            })
            .exec();

      if (!updatedRecord) throw new BadRequestException(RECORD_NOT_FOUND);

      // Update the prop isPaid to true of the expenses related to this income
      if (
        isIncome &&
        (changes as CreateIncomeDto).expensesPaid?.length > 0 &&
        !skipUpdateExpensesPaid
      ) {
        const expensesIds: CreateExpense[] = (changes as CreateIncomeDto)
          .expensesPaid;
        const payload: UpdateExpenseDto[] = expensesIds.map((id) => ({
          recordId: id,
          isPaid: true,
          userId,
        }));
        await this.updateMultipleRecords(payload);
      }

      const response: UpdateRecordResponse = {
        ...INITIAL_RESPONSE,
        data: {
          record: updatedRecord,
        },
      };
      return response;
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

  async removeRecord({ payload, userId, isIncome = false }: RemoveRecordProps) {
    try {
      const { recordId } = payload;
      await this.verifyRecordBelongsUser(recordId, userId, isIncome);

      // Return expenses to not paid
      if (isIncome) {
        const income = await this.incomeModel.findById(recordId);

        // Check if there are any expenses related to this income
        if (income?.expensesPaid?.length > 0) {
          // set expenses as not paid
          const payload: UpdateExpenseDto[] = income.expensesPaid.map((id) => ({
            recordId: id,
            isPaid: false,
            userId,
          }));
          await this.updateMultipleRecords(payload);
        }
      }

      const recordDeleted: Expense | Income = !isIncome
        ? await this.expenseModel.findByIdAndDelete(recordId)
        : await this.incomeModel.findByIdAndDelete(recordId);
      if (!recordDeleted) throw new BadRequestException(RECORD_NOT_FOUND);

      const response: GeneralResponse = {
        ...INITIAL_RESPONSE,
        message: RECORD_DELETED,
        data: recordDeleted,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteMultipleRecords(records: DeleteRecordDto[], isIncome = false) {
    try {
      const recordsIds = records.map((record) => record.recordId);
      const deletedRecords: Expense[] | Income[] = !isIncome
        ? await Promise.all(
            recordsIds.map((id) => this.expenseModel.findByIdAndDelete(id)),
          )
        : await Promise.all(
            recordsIds.map((id) => this.incomeModel.findByIdAndDelete(id)),
          );
      const checkDeletedRecords = deletedRecords.map(
        (record: Expense | Income, index: number) => {
          if (!record) return `record id ${records[index].recordId} not found`;
          return record;
        },
      );

      const response: BatchRecordsResponse = {
        ...INITIAL_RESPONSE,
        data: checkDeletedRecords,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
