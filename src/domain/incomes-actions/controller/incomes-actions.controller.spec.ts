import { Test, TestingModule } from '@nestjs/testing';
import { IncomesActionsController } from './incomes-actions.controller';

describe('IncomesActionsController', () => {
  let controller: IncomesActionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncomesActionsController],
    }).compile();

    controller = module.get<IncomesActionsController>(IncomesActionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
