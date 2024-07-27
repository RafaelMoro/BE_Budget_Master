import { Test, TestingModule } from '@nestjs/testing';
import { AccountsUserAccountsActionsService } from './accounts.user-accounts-actions.service';

describe('AccountsUserAccountsActionsService', () => {
  let service: AccountsUserAccountsActionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccountsUserAccountsActionsService],
    }).compile();

    service = module.get<AccountsUserAccountsActionsService>(AccountsUserAccountsActionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
