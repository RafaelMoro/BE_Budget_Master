import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ExpensesActionsService } from '../services/expenses-actions.service';
import {
  CreateExpenseDto,
  DeleteExpenseDto,
  UpdateExpenseDto,
} from '../../../repositories/expenses/expenses.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('expenses-actions')
export class ExpensesActionsController {
  constructor(private expenseActionsService: ExpensesActionsService) {}

  @Post()
  createExpense(@Body() payload: CreateExpenseDto, @Request() req) {
    const userId = req.user.sub;
    return this.expenseActionsService.createExpense({ data: payload, userId });
  }

  @Put()
  updateExpense(@Body() payload: UpdateExpenseDto, @Request() req) {
    const userId = req.user.sub;
    return this.expenseActionsService.updateExpense({
      changes: payload,
      userIdGotten: userId,
    });
  }

  @Delete()
  removeExpense(@Body() payload: DeleteExpenseDto, @Request() req) {
    const userId = req.user.sub;
    return this.expenseActionsService.removeExpense({ payload, userId });
  }

  @Get(':accountId/:month/:year')
  findExpensesByAccountMonthAndYear(
    @Param('accountId') accountId: string,
    @Param('month') month: string,
    @Param('year') year: string,
    @Request() req,
  ) {
    const userId = req.user.sub;
    return this.expenseActionsService.findOnlyExpensesByMonthAndYear({
      accountId,
      month,
      year,
      userId,
    });
  }
}
