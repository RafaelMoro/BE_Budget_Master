import { Test, TestingModule } from '@nestjs/testing';
import { IncomesActionsService } from './incomes-actions.service';

describe('IncomesActionsService', () => {
  let service: IncomesActionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IncomesActionsService],
    }).compile();

    service = module.get<IncomesActionsService>(IncomesActionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
