import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import {
  CreateBudgetsDto,
  DeleteBudgetDto,
  UpdateBudgetDto,
} from '../dtos/budgets.dto';
import { BudgetsService } from '../services/budgets.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetsController {
  constructor(private budgetServices: BudgetsService) {}

  @Post()
  createBudget(@Body() payload: CreateBudgetsDto, @Request() req) {
    const sub = req.user.sub;
    return this.budgetServices.createBudget({ payload, sub });
  }

  @Get()
  getBudgets(@Request() req) {
    const userId = req.user.sub;
    return this.budgetServices.getBudgets(userId);
  }

  @Get(':budgetId')
  getSingleBudget(@Param('budgetId') budgetId: string, @Request() req) {
    const sub = req.user.sub;
    return this.budgetServices.getSingleBudget({ budgetId, sub });
  }

  @Delete()
  removeBudget(@Body() payload: DeleteBudgetDto, @Request() req) {
    const sub = req.user.sub;
    return this.budgetServices.removeBudgetHistory({ payload, sub });
  }

  @Put()
  updateBudget(@Body() payload: UpdateBudgetDto, @Request() req) {
    const sub = req.user.sub;
    return this.budgetServices.updateBudget({ changes: payload, sub });
  }
}
