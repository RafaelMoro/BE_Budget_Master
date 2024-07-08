import { Test, TestingModule } from '@nestjs/testing';
import { BudgetHistoryController } from './budget-history.controller';

describe('BudgetHistoryController', () => {
  let controller: BudgetHistoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BudgetHistoryController],
    }).compile();

    controller = module.get<BudgetHistoryController>(BudgetHistoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
