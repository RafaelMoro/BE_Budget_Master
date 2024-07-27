import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ExpensesActionsService } from '../services/expenses-actions.service';
import { CreateExpenseDto } from '../../../expenses/expenses.dto';
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
}
