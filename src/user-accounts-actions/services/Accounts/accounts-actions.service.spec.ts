import { Test, TestingModule } from '@nestjs/testing';
import { AccountsActionsService } from './accounts.-actions.service';

describe('AccountsUserAccountsActionsService', () => {
  let service: AccountsActionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccountsActionsService],
    }).compile();

    service = module.get<AccountsActionsService>(
      AccountsActionsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
