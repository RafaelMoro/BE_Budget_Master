import { Controller, UseGuards } from '@nestjs/common';
import { IncomesService } from '../services/incomes.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('incomes')
export class IncomesController {
  constructor(private incomesService: IncomesService) {}
}
