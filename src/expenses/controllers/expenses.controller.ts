import {
  Body,
  Controller,
  UseGuards,
  Request,
  Put,
  Get,
  Param,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ExpensesService } from '../services/expenses.service';
import { UpdateExpenseDto } from '../expenses.dto';

@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  // @Put('/multiple')
  // updateMultipleExpense(@Body() payload: UpdateExpenseDto[]) {
  //   return this.expensesService.updateMultipleExpenses(payload);
  // }

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
