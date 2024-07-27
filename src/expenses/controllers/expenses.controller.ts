import {
  Body,
  Controller,
  UseGuards,
  Request,
  Put,
  Delete,
  Get,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ExpensesService } from '../services/expenses.service';
import { DeleteExpenseDto, UpdateExpenseDto } from '../expenses.dto';

@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Put()
  updateExpense(@Body() payload: UpdateExpenseDto, @Request() req) {
    const userId = req.user.sub;
    return this.expensesService.updateExpense({ changes: payload, userId });
  }

  @Put('/multiple')
  updateMultipleExpense(@Body() payload: UpdateExpenseDto[]) {
    return this.expensesService.updateMultipleExpenses(payload);
  }

  @Delete()
  removeExpense(@Body() payload: DeleteExpenseDto, @Request() req) {
    const userId = req.user.sub;
    return this.expensesService.removeExpense({ payload, userId });
  }

  @Get(':accountId/:month/:year')
  findExpensesByAccountMonthAndYear(
    @Param('accountId') accountId: string,
    @Param('month') month: string,
    @Param('year') year: string,
    @Request() req,
  ) {
    const userId = req.user.sub;
    return this.expensesService.findOnlyExpensesByMonthAndYear({
      accountId,
      month,
      year,
      userId,
    });
  }
}
