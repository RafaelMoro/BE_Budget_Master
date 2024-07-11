import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { IncomesService } from '../services/incomes.service';
import { CreateIncomeDto } from '../incomes.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('incomes')
export class IncomesController {
  constructor(private incomesService: IncomesService) {}

  @Post()
  createIncome(@Body() payload: CreateIncomeDto, @Request() req) {
    const userId = req.user.sub;
    return this.incomesService.createIncome(payload, userId);
  }
}
