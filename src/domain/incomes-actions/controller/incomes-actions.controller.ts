import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  Put,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { IncomesActionsService } from '../services/incomes-actions.service';
import {
  CreateIncomeDto,
  DeleteIncomeDto,
  UpdateIncomeDto,
} from '../../../repositories/incomes/incomes.dto';

@UseGuards(JwtAuthGuard)
@Controller('incomes-actions')
export class IncomesActionsController {
  constructor(private incomesActionsService: IncomesActionsService) {}

  @Post()
  createIncome(@Body() payload: CreateIncomeDto, @Request() req) {
    const userId = req.user.sub;
    return this.incomesActionsService.createIncome({ data: payload, userId });
  }

  @Put()
  updateIncome(@Body() payload: UpdateIncomeDto, @Request() req) {
    const userId = req.user.sub;
    return this.incomesActionsService.updateIncome({
      changes: payload,
      userIdGotten: userId,
    });
  }

  @Delete()
  removeExpense(@Body() payload: DeleteIncomeDto, @Request() req) {
    const userId = req.user.sub;
    return this.incomesActionsService.removeIncome({ payload, userId });
  }
}
