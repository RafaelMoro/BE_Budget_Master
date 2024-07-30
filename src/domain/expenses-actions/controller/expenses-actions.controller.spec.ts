import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesActionsController } from './expenses-actions.controller';

describe('ExpensesActionsController', () => {
  let controller: ExpensesActionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpensesActionsController],
    }).compile();

    controller = module.get<ExpensesActionsController>(ExpensesActionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
