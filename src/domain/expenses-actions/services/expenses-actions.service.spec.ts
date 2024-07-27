import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesActionsService } from './expenses-actions.service';

describe('ExpensesActionsService', () => {
  let service: ExpensesActionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExpensesActionsService],
    }).compile();

    service = module.get<ExpensesActionsService>(ExpensesActionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
