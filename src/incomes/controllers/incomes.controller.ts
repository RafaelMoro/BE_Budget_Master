import { Body, Controller, Delete, Request, UseGuards } from '@nestjs/common';
import { IncomesService } from '../services/incomes.service';
import { DeleteIncomeDto } from '../incomes.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('incomes')
export class IncomesController {
  constructor(private incomesService: IncomesService) {}

  @Delete()
  removeExpense(@Body() payload: DeleteIncomeDto, @Request() req) {
    const userId = req.user.sub;
    return this.incomesService.removeIncome({ payload, userId });
  }
}
