import { Injectable, BadRequestException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Types, isValidObjectId } from 'mongoose';

import { AccountRecord } from '../entities/records.entity';
import { Expense } from '../entities/expenses.entity';
import { Income } from '../entities/incomes.entity';
import { CategoriesService } from '../../categories/services/categories.service';
import { EXPENSE_NOT_FOUND, INCOME_NOT_FOUND } from '../constants';
import {
  CreateOrModifyCategoryForRecordResponse,
  FindAllNotPaidExpensesByMonthResponse,
  DeleteRecordResponse,
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

@Injectable()
export class RecordsService {
  constructor(
    @InjectModel(AccountRecord.name) private recordModel: Model<AccountRecord>,
    @InjectModel(Expense.name) private expenseModel: Model<Expense>,
    @InjectModel(Income.name) private incomeModel: Model<Income>,
    private categoriesService: CategoriesService,
  ) {}

  async createOneRecord(
    data: CreateExpenseDto | CreateIncomeDto,
    isIncome = false,
    userId: string,
  ) {
    try {
      const { category, subCategory, amount } = data;
      const { categoryId } = await this.createOrModifyCategoryForRecord(
        category,
        subCategory,
        userId,
      );
      const { fullDate, formattedTime } = formatDateToString(data.date);
      const amountFormatted = formatNumberToCurrency(amount);
      const newData = {
        ...data,
        fullDate,
        formattedTime,
        category: categoryId,
        amountFormatted,
      };
      const newModel = !isIncome
        ? new this.expenseModel(newData)
        : new this.incomeModel(newData);
      const model = await newModel.save();

      // Update the prop isPaid to true of the expenses related to this income
      if (isIncome) {
        const expensesIds: Expense[] = (data as CreateIncomeDto).expensesPaid;
        const payload: UpdateExpenseDto[] = expensesIds.map((id) => ({
          recordId: id,
          isPaid: true,
        }));
        await this.updateMultipleRecords(payload);
      }
      return model;
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
  async createOrModifyCategoryForRecord(
    // category could be a name or a mongo id
    category: string,
    subCategory: string,
    userId: string,
  ): Promise<CreateOrModifyCategoryForRecordResponse> {
    try {
      const categoryIsMongoId = isValidObjectId(category);

      if (categoryIsMongoId) {
        // Check the category exists
        const categoryReturned = await this.categoriesService.findById(
          category,
        );

        if (categoryReturned.length === 0) {
          // This means that the mongo id passed does not belongs to a category
          return {
            message: 'Mongo Id does not belong to a category',
            categoryId: category,
          };
        }

        const { categoryId, message } =
          await this.categoriesService.updateSubcategories(
            categoryReturned[0],
            subCategory,
          );
        return {
          message,
          categoryId,
        };
      }

      // The category is a name and check it if it already exists
      const searchedCategory = await this.categoriesService.findByName(
        category,
      );

      // The category already exists with that name.
      if (searchedCategory.length > 0) {
        // Update subcategories if needed
        const { categoryId, message } =
          await this.categoriesService.updateSubcategories(
            searchedCategory[0],
            subCategory,
          );
        return {
          message: 'Category already exists. ' + message,
          categoryId: categoryId,
        };
      }

      // The category is a name and does not exists, then create it.
      const payload: CreateCategoriesDto = {
        categoryName: category,
        subCategories: [subCategory],
      };
      const newCategory = await this.categoriesService.createOne(
        payload,
        userId,
      );
      return {
        message: 'New category created',
        categoryId: newCategory._id,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findRecordsByAccount(accountId: string, isIncome = false) {
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

      if (isIncome && records.length > 0) {
        // Check if the any record has any expenses paid linked.
        return this.formatIncome(
          records as Omit<
            Income & {
              _id: Types.ObjectId;
            },
            never
          >[],
        );
      }

      if (records.length === 0) {
        // returning a message because this service is used when an account is deleted. If no records are found and an exception is throwed,
        // it would break the service to delete an account with no records.
        const message = !isIncome ? EXPENSE_NOT_FOUND : INCOME_NOT_FOUND;
        return message;
      }

      return records;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
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
  ): Promise<FindAllNotPaidExpensesByMonthResponse> {
    try {
      const regexDate = `${month}.*${year}|${year}.*${month}`;
      const expenses = await this.expenseModel
        .find({
          account: accountId,
          fullDate: { $regex: new RegExp(regexDate, 'i') },
        })
        .populate({ path: 'category', select: 'categoryName' })
        .exec();

      if (expenses.length === 0) {
        return {
          message: 'Not expenses found on this month',
          expenses,
        };
      }
      return {
        message: null,
        expenses,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAllIncomesAndExpensesByMonthAndYear(
    accountId: string,
    month: string,
    year: string,
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

      return this.joinIncomesAndExpenses(expenses, incomes);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  joinIncomesAndExpenses(
    expenses: (Expense & { _id: Types.ObjectId })[],
    incomes: Omit<
      Income & {
        _id: Types.ObjectId;
      },
      never
    >[],
  ) {
    if (expenses.length === 0 && incomes.length === 0) {
      return {
        records: null,
        message: 'No incomes or expenses found',
      };
    }

    if (expenses.length === 0) {
      const incomesOrdered = incomes.sort(compareDateAndTime);
      const incomesFormatted = this.formatIncome(incomesOrdered);
      return { records: incomesFormatted, message: 'No expenses found.' };
    }

    if (incomes.length === 0) {
      const expensesOrdered = expenses.sort(compareDateAndTime);
      return { records: expensesOrdered, message: 'No incomes found.' };
    }

    const formattedIncomes = this.formatIncome(incomes);
    const records = [...expenses, ...formattedIncomes].sort(compareDateAndTime);
    return { records, message: null };
  }

  formatIncome(
    incomes: Omit<
      Income & {
        _id: Types.ObjectId;
      },
      never
    >[],
  ) {
    const noExpensesPaidFound = incomes.every(
      (record) => record.expensesPaid.length === 0,
    );
    if (noExpensesPaidFound) return incomes;

    // Formatting expenses paid as the front end expect.
    const newRecords = incomes.map((record) => {
      if (record.expensesPaid.length === 0) return record.toJSON();

      const expensesPaid = record.expensesPaid.map((expense) => {
        const { _id, shortName, amount, fullDate, formattedTime } = expense;
        return { _id, shortName, amount, fullDate, formattedTime };
      });
      return { ...record.toJSON(), expensesPaid };
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
      const { recordId, category, subCategory, date, amount } = changes;
      const { categoryId } = await this.createOrModifyCategoryForRecord(
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

      if (!updatedRecord) throw new BadRequestException('Record not found');

      // Update the prop isPaid to true of the expenses related to this income
      if (isIncome && (changes as CreateIncomeDto).expensesPaid.length > 0) {
        const expensesIds: Expense[] = (changes as CreateIncomeDto)
          .expensesPaid;
        const payload: UpdateExpenseDto[] = expensesIds.map((id) => ({
          recordId: id,
          isPaid: true,
        }));
        await this.updateMultipleRecords(payload);
      }
      return updatedRecord;
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

  async removeRecord(payload: DeleteRecordDto, isIncome = false) {
    try {
      const { recordId } = payload;

      // Return expenses to not paid
      if (isIncome) {
        const income = await this.incomeModel.findById(recordId);

        // Check if there are any expenses related to this income
        if (income?.expensesPaid.length > 0) {
          // set expenses as not paid
          const payload: UpdateExpenseDto[] = income.expensesPaid.map((id) => ({
            recordId: id,
            isPaid: false,
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
