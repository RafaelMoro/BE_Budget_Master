import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { CreateBudgetsDto } from '../dtos/budgets.dto';
import { BudgetsService } from '../services/budgets.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetsController {
  constructor(private budgetServices: BudgetsService) {}

  @Post()
  createCategory(@Body() payload: CreateBudgetsDto) {
    return this.budgetServices.createBudget(payload);
  }

  @Get()
  getCategories(@Request() req) {
    const userId = req.user.sub;
    return this.budgetServices.getBudgets(userId);
  }
}
