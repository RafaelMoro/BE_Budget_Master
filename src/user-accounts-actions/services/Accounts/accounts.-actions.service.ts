import { BadRequestException, Injectable } from '@nestjs/common';
import { AccountsService } from '../../../accounts/services/accounts.service';
import { RecordsService } from '../../../records/services/records.service';
import { EXPENSES_NOT_FOUND } from '../../../expenses/expenses.constants';
import { INCOMES_NOT_FOUND } from '../../../incomes/incomes.constants';
import {
  CreateAccountDto,
  DeleteAccountDto,
  UpdateAccountDto,
} from '../../../accounts/dtos/accounts.dto';
import {
  ACCOUNT_CREATED_MESSAGE,
  ACCOUNT_DELETED_MESSAGE,
  ACCOUNT_UPDATED_MESSAGE,
} from '../../../accounts/constants';
import { VERSION_RESPONSE } from '../../../constants';
import {
  DeleteAccountResponse,
  GeneralAccountResponse,
  GetAccountResponse,
} from '../../../accounts/accounts.interface';

@Injectable()
export class AccountsActionsService {
  constructor(
    private accountsService: AccountsService,
    private recordsService: RecordsService,
  ) {}

  async createAccount({
    data,
    userId,
  }: {
    data: CreateAccountDto;
    userId: string;
  }) {
    try {
      const accountCreated = await this.accountsService.createOneAccount(
        data,
        userId,
      );
      const response: GeneralAccountResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: ACCOUNT_CREATED_MESSAGE,
        data: {
          account: accountCreated,
        },
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findByUser({
    userId,
  }: {
    userId: string;
  }): Promise<GetAccountResponse> {
    try {
      const accounts = await this.accountsService.findByUser(userId);
      const response: GetAccountResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: null,
        data: {
          accounts,
        },
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateAccount({ changes }: { changes: UpdateAccountDto }) {
    try {
      const updatedAccount = await this.accountsService.update(changes);
      const response: GeneralAccountResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: ACCOUNT_UPDATED_MESSAGE,
        data: {
          account: updatedAccount,
        },
        error: null,
      };
      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteAccount({
    payload,
    userId,
  }: {
    payload: DeleteAccountDto;
    userId: string;
  }) {
    try {
      let expenseRecords = null;
      let incomesRecords = null;
      const { accountId } = payload;

      // Check if the account has records.
      const expensesRelatedToAccount =
        await this.recordsService.findAllExpensesByAccount({
          accountId,
          userId,
        });
      const incomesRelatedToAccount =
        await this.recordsService.findAllIncomesByAccount({
          accountId,
          userId,
        });

      // If the account has expenses, then delete expenses.
      if (expensesRelatedToAccount.message !== EXPENSES_NOT_FOUND) {
        // Return each record id as object as expected to the service delete multiple records.
        const expensesIds = expensesRelatedToAccount.expenses.map((expense) => {
          return { recordId: expense._id.toString() };
        });
        const { expenses } = await this.recordsService.deleteMultipleExpenses({
          expenses: expensesIds,
        });
        expenseRecords = expenses;
      }

      // If the account has incomes, then delete incomes.
      if (incomesRelatedToAccount.message !== INCOMES_NOT_FOUND) {
        // Return records id as object each as expected to the service delete multiple records.
        const incomesIds = incomesRelatedToAccount.incomes.map((income) => {
          return { recordId: income._id.toString() };
        });
        const { incomes } = await this.recordsService.deleteMultipleIncomes({
          incomes: incomesIds,
        });
        incomesRecords = incomes;
      }

      const accountDeleted = await this.accountsService.remove(payload);

      const response: DeleteAccountResponse = {
        version: VERSION_RESPONSE,
        success: true,
        message: ACCOUNT_DELETED_MESSAGE,
        data: {
          accountDeleted,
          numberExpensesDeleted: expenseRecords?.length ?? 0,
          numberIncomesDeleted: incomesRecords?.length ?? 0,
        },
        error: null,
      };

      return response;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
