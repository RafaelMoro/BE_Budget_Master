import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BudgetHistoryService } from '../services/budget-history.service';
import { CreateBudgetHistoryDto } from '../budget-history.dto';

@UseGuards(JwtAuthGuard)
@Controller('budget-history')
export class BudgetHistoryController {
  constructor(private budgetHistoryService: BudgetHistoryService) {}

  @Post()
  createCategory(@Body() payload: CreateBudgetHistoryDto) {
    return this.budgetHistoryService.createBudgtHistory(payload);
  }
}
