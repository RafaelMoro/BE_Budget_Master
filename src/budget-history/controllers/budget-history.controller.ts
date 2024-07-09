import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { BudgetHistoryService } from '../services/budget-history.service';
import {
  AddRecordToBudgetHistoryDto,
  CreateBudgetHistoryDto,
  DeleteBudgetHistoryDto,
  UpdateBudgetHistoryDto,
} from '../budget-history.dto';

@UseGuards(JwtAuthGuard)
@Controller('budget-history')
export class BudgetHistoryController {
  constructor(private budgetHistoryService: BudgetHistoryService) {}

  @Post()
  createBudgetHistory(@Body() payload: CreateBudgetHistoryDto, @Request() req) {
    const sub = req.user.sub;
    return this.budgetHistoryService.createBudgtHistory({ payload, sub });
  }

  @Post('add-record')
  addRecordToBudgetHistory(
    @Body() payload: AddRecordToBudgetHistoryDto,
    @Request() req,
  ) {
    const { budgetHistoryId, record } = payload;
    const sub = req.user.sub;
    return this.budgetHistoryService.addRecordToBudgetHistory({
      newRecord: record,
      sub,
      budgetHistoryId,
    });
  }

  @Get()
  getBudgetsHistory(@Request() req) {
    const userId = req.user.sub;
    return this.budgetHistoryService.getBudgetsHistory(userId);
  }

  @Get(':budgetHistoryId')
  getSingleBudgetHistory(
    @Param('budgetHistoryId') budgetHistoryId: string,
    @Request() req,
  ) {
    const userId = req.user.sub;
    return this.budgetHistoryService.getSingleBudgetHistory({
      sub: userId,
      budgetHistoryId,
    });
  }

  @Delete()
  removeBudgetHistory(@Body() payload: DeleteBudgetHistoryDto, @Request() req) {
    const sub = req.user.sub;
    return this.budgetHistoryService.removeBudgetHistory({ payload, sub });
  }

  @Put()
  updateBudgetHistory(@Body() payload: UpdateBudgetHistoryDto, @Request() req) {
    const sub = req.user.sub;
    return this.budgetHistoryService.updateBudgetHistory({
      changes: payload,
      sub,
    });
  }
}
