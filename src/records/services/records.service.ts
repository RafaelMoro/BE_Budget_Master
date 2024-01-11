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
import {
  INITIAL_RESPONSE,
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
} from '../constants';
import {
  DeleteRecordResponse,
  FindRecordsByAccountProps,
  RemoveRecordProps,
  RecordCreated,
  MultipleRecordsResponse,
  FormattedIncomes,
  ExpensesPaidFormatted,
  JoinRecordsResponse,
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
      const { data: categoryFoundOrCreated } =
        await this.findOrCreateCategoryForRecord(category, subCategory, userId);
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
      }
      const { _id, categoryName } = categoryFoundOrCreated;
      // Change record categories for the categoryResponse
      const record = {
        ...modelSaved.toJSON(),
        category: { _id, categoryName },
      };
      const response: RecordCreated = {
        version: VERSION_RESPONSE,
        success: true,
        message: RECORD_CREATED_MESSAGE,
        data: record,
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /*
   * This method will take the category by name or mongo id.
   * If it's a name, it will search if the category has been created or not, if it has been created, it will update subcategories if needed.
   * If the category is by mongo id, it will check if it exists and will update subcategories if needed.
   * This method returns an object that contains "message: string | null" and "categoryId: string"
   */
  async findOrCreateCategoryForRecord(
    // category it's only a name
    category: string,
    subCategory: string,
    userId: string,
  ) {
    try {
      // Check if category already exists.
      const { data: searchedCategory } =
        await this.categoriesService.findByName(category);

      // The category already exists with that name.
      if (searchedCategory) {
        const [foundCategory] = searchedCategory;
        const response: SingleCategoryResponse = {
          version: VERSION_RESPONSE,
          success: true,
          message: CATEGORY_EXISTS_MESSAGE,
          data: foundCategory,
          error: null,
        };
        return response;
      }

      // The category is a name and does not exists, then create it.
      const payload: CreateCategoriesDto = {
        categoryName: category,
        subCategories: [subCategory],
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
            .populate('expensesPaid')
            .populate('category', 'categoryName')
            .exec();

      if (isIncome) {
        this.verifyIncomesBelongsToUser(records as Income[], userId);
      } else {
        this.verifyExpensesBelongsToUser(records as Expense[], userId);
      }

      if (isIncome && records.length > 0) {
        // Check if the any record has any expenses paid linked.
        const incomesFormatted = this.formatIncome(records as Income[]);
        const response: MultipleRecordsResponse = {
          ...INITIAL_RESPONSE,
          data: incomesFormatted,
        };
        return response;
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
        data: records,
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
        .populate('category', 'categoryName')
        .exec();
      const incomes = await this.incomeModel
        .find({
          account: accountId,
        })
        .populate('expensesPaid')
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
        .populate({ path: 'category', select: 'categoryName' })
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

      const response: GeneralResponse = { ...INITIAL_RESPONSE, data: expenses };
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
        .populate({ path: 'category', select: 'categoryName' })
        .exec();
      const incomes = await this.incomeModel
        .find({
          account: accountId,
          fullDate: { $regex: new RegExp(month, 'i') },
        })
        .populate('expensesPaid')
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
      const incomesFormatted = this.formatIncome(incomesOrdered);
      const onlyIncomesFoundResponse: MultipleRecordsResponse = {
        ...INITIAL_RESPONSE,
        data: incomesFormatted,
        message: NO_EXPENSES_FOUND,
      };
      return onlyIncomesFoundResponse;
    }

    if (incomes.length === 0) {
      // No incomes found, return the expenses found.
      const expensesOrdered = expenses.sort(compareDateAndTime);
      const onlyExpensesFoundResponse: MultipleRecordsResponse = {
        ...INITIAL_RESPONSE,
        data: expensesOrdered,
        message: NO_INCOMES_FOUND,
      };
      return onlyExpensesFoundResponse;
    }

    const formattedIncomes = this.formatIncome(incomes);
    const records = [...expenses, ...formattedIncomes].sort(compareDateAndTime);
    const response: JoinRecordsResponse = {
      ...INITIAL_RESPONSE,
      data: records,
    };
    return response;
  }

  formatIncome(incomes: Income[]): FormattedIncomes[] | Income[] {
    const noExpensesPaidFound = incomes.every(
      (record) => record.expensesPaid.length === 0,
    );
    if (noExpensesPaidFound) return incomes;

    // Formatting expenses paid as the front end expect.
    const newRecords: FormattedIncomes[] = incomes.map((record) => {
      if (record.expensesPaid.length === 0) return record.toObject();

      const expensesPaid: ExpensesPaidFormatted[] = record.expensesPaid.map(
        (expense) => {
          const { _id, shortName, amount, fullDate, formattedTime } = expense;
          return { _id, shortName, amount, fullDate, formattedTime };
        },
      );
      return { ...record.toObject(), expensesPaid };
    });
    return newRecords;
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
        data: { _id: categoryId },
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
      const response: GeneralResponse = {
        ...INITIAL_RESPONSE,
        data: updatedRecord,
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
      return checkUpdatedRecords;
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
      const { userId: recordUserId } = record;
      if (userId !== recordUserId) {
        throw new UnauthorizedException(
          'This record does not belongs to the user',
        );
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
        if (income?.expensesPaid.length > 0) {
          // set expenses as not paid
          const payload: UpdateExpenseDto[] = income.expensesPaid.map((id) => ({
            recordId: id,
            isPaid: false,
            userId,
          }));
          await this.updateMultipleRecords(payload);
        }
      }

      const recordDeleted = !isIncome
        ? await this.expenseModel.findByIdAndDelete(recordId)
        : await this.incomeModel.findByIdAndDelete(recordId);
      if (!recordDeleted) throw new BadRequestException('Record not found');
      const response: DeleteRecordResponse = {
        message: null,
        error: null,
        deleteRecordSuccess: true,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteMultipleRecords(records: DeleteRecordDto[], isIncome = false) {
    try {
      const recordsIds = records.map((record) => record.recordId);
      const deletedRecords = !isIncome
        ? await Promise.all(
            recordsIds.map((id) => this.expenseModel.findByIdAndDelete(id)),
          )
        : await Promise.all(
            recordsIds.map((id) => this.incomeModel.findByIdAndDelete(id)),
          );
      const checkDeletedRecords = deletedRecords.map((record, index) => {
        if (!record) return `record id ${records[index].recordId} not found`;
        return record;
      });
      return checkDeletedRecords;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
