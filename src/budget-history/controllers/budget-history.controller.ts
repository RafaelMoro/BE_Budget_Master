import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BudgetHistoryService } from '../services/budget-history.service';
import {
  CreateBudgetHistoryDto,
  DeleteBudgetHistoryDto,
} from '../budget-history.dto';

@UseGuards(JwtAuthGuard)
@Controller('budget-history')
export class BudgetHistoryController {
  constructor(private budgetHistoryService: BudgetHistoryService) {}

  @Post()
  createCategory(@Body() payload: CreateBudgetHistoryDto) {
    return this.budgetHistoryService.createBudgtHistory(payload);
  }

  @Get(':budgetHistoryId')
  getCategory(
    @Param('budgetHistoryId') budgetHistoryId: string,
    @Request() req,
  ) {
    const userId = req.user.sub;
    return this.budgetHistoryService.getBudgetHistory({
      sub: userId,
      budgetHistoryId,
    });
  }

  @Delete()
  removeIncome(@Body() payload: DeleteBudgetHistoryDto) {
    return this.budgetHistoryService.removeBudgetHistory(payload);
  }
}
