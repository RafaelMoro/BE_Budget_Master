import {
  Body,
  Controller,
  Delete,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { IncomesService } from '../services/incomes.service';
import {
  CreateIncomeDto,
  DeleteIncomeDto,
  UpdateIncomeDto,
} from '../incomes.dto';
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

  @Put()
  updateIncome(@Body() payload: UpdateIncomeDto, @Request() req) {
    const userId = req.user.sub;
    return this.incomesService.updateIncome({ changes: payload, userId });
  }

  @Delete()
  removeExpense(@Body() payload: DeleteIncomeDto, @Request() req) {
    const userId = req.user.sub;
    return this.incomesService.removeIncome({ payload, userId });
  }
}