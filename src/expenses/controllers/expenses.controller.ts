import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Put,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ExpensesService } from '../services/expenses.service';
import {
  CreateExpenseDto,
  DeleteExpenseDto,
  UpdateExpenseDto,
} from '../expenses.dto';

@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Post()
  createExpense(@Body() payload: CreateExpenseDto, @Request() req) {
    const userId = req.user.sub;
    return this.expensesService.createExpense(payload, userId);
  }

  @Put()
  updateExpense(@Body() payload: UpdateExpenseDto, @Request() req) {
    const userId = req.user.sub;
    return this.expensesService.updateExpense({ changes: payload, userId });
  }

  @Delete()
  removeExpense(@Body() payload: DeleteExpenseDto, @Request() req) {
    const userId = req.user.sub;
    return this.expensesService.removeExpense({ payload, userId });
  }
}
