import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { IncomesActionsService } from '../services/incomes-actions.service';
import { CreateIncomeDto } from '../../../incomes/incomes.dto';

@UseGuards(JwtAuthGuard)
@Controller('incomes-actions')
export class IncomesActionsController {
  constructor(private incomesActionsService: IncomesActionsService) {}

  @Post()
  createIncome(@Body() payload: CreateIncomeDto, @Request() req) {
    const userId = req.user.sub;
    return this.incomesActionsService.createIncome({ data: payload, userId });
  }
}
