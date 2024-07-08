import { Test, TestingModule } from '@nestjs/testing';
import { BudgetHistoryService } from './budget-history.service';

describe('BudgetHistoryService', () => {
  let service: BudgetHistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BudgetHistoryService],
    }).compile();

    service = module.get<BudgetHistoryService>(BudgetHistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
