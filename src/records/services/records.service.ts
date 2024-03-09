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
} from '../constants';
import {
  FindRecordsByAccountProps,
  RemoveRecordProps,
  RecordCreated,
  JoinRecordsResponse,
  MultipleRecordsResponse,
  BatchRecordsResponse,
} from '../interface';
import { DeleteRecordDto } from '../dtos/records.dto';
import { CreateExpenseDto, UpdateExpenseDto } from '../dtos/expenses.dto';
import { CreateIncomeDto, UpdateIncomeDto } from '../dtos/incomes.dto';
import {
  formatDateToString,
  compareDateAndTime,
  formatNumberToCurrency,
} from '../../utils';
import { CreateCategoriesDto } from '../../categories/dtos/categories.dto';
import { VERSION_RESPONSE } from '../../constants';
import { SingleCategoryResponse } from '../../categories/interface';
import { CATEGORY_EXISTS_MESSAGE } from '../../categories/constants';
import { GeneralResponse } from '../../response.interface';
import { getLocalCategory } from '../../utils/getLocalCategory';

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
      const { category, subCategory, amount } = data;
      const {
        data: { category: categoryFoundOrCreated },
      } = await this.findOrCreateCategoryForRecord(
        category,
        subCategory,
        userId,
      );
      const { _id: categoryId } = categoryFoundOrCreated;
      const { fullDate, formattedTime } = formatDateToString(data.date);
      const amountFormatted = formatNumberToCurrency(amount);
      const newData = {
        ...data,
        fullDate,
        formattedTime,
        category: categoryId,
        amountFormatted,
        userId,
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

  /*
   * This method will take the category only by name.
   * It will search if the category has been created or not, if it has been created, it will update subcategories if needed.
   * This method returns the standarized response with the category.
   */
  async findOrCreateCategoryForRecord(
    // category it's only a name
    category: string,
    subCategory: string,
    userId: string,
  ) {
    try {
      // Check if category already exists.
      const categoryResponse = await this.categoriesService.findByName(
        category,
      );
      const searchedCategory = categoryResponse.data?.categories;

      // The category already exists with that name.
      if (searchedCategory) {
        const [foundCategory] = searchedCategory;
        const response: SingleCategoryResponse = {
          version: VERSION_RESPONSE,
          success: true,
          message: CATEGORY_EXISTS_MESSAGE,
          data: {
            category: foundCategory,
          },
          error: null,
        };
        return response;
      }

      const icon = getLocalCategory(category);
      // The category is a name and does not exists, then create it.
      const payload: CreateCategoriesDto = {
        categoryName: category,
        subCategories: [subCategory],
        icon,
      };
      const response = await this.categoriesService.createOneCategory(
        payload,
        userId,
      );
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
        .populate('category', 'categoryName')
        .exec();

      this.verifyExpensesBelongsToUser(expenses, userId);
      this.verifyIncomesBelongsToUser(incomes, userId);

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

  async updateRecord(
    changes: UpdateIncomeDto | UpdateExpenseDto,
    isIncome = false,
    userId: string,
  ) {
    try {
      const {
        recordId,
        category,
        subCategory,
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

      const {
        data: {
          category: { _id: categoryId, categoryName },
        },
      } = await this.findOrCreateCategoryForRecord(
        category,
        subCategory,
        userId,
      );
      const { fullDate, formattedTime } = formatDateToString(date);
      const amountFormatted = formatNumberToCurrency(amount);
      const newChanges = {
        ...changes,
        category: categoryId,
        fullDate,
        formattedTime,
        amountFormatted,
      };
      const updatedRecord = !isIncome
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
      if (isIncome && (changes as CreateIncomeDto).expensesPaid?.length > 0) {
        const expensesIds: CreateExpense[] = (changes as CreateIncomeDto)
          .expensesPaid;
        const payload: UpdateExpenseDto[] = expensesIds.map((id) => ({
          recordId: id,
          isPaid: true,
          userId,
        }));
        await this.updateMultipleRecords(payload);
      }

      const { categoryFromRecord, ...restProps } = updatedRecord.toObject();
      const recordWithCategory = {
        ...restProps,
        category: { _id: categoryId, categoryName },
      };
      const response: GeneralResponse = {
        ...INITIAL_RESPONSE,
        data: {
          record: recordWithCategory,
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
