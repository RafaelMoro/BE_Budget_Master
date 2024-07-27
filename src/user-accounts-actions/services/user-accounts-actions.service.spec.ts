import { Test, TestingModule } from '@nestjs/testing';
import { UserAccountsActionsService } from './user-accounts-actions.service';

describe('UserAccountsActionsService', () => {
  let service: UserAccountsActionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserAccountsActionsService],
    }).compile();

    service = module.get<UserAccountsActionsService>(
      UserAccountsActionsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
