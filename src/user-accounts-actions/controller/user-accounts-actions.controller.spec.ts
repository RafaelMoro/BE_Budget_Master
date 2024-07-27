import { Test, TestingModule } from '@nestjs/testing';
import { UserAccountsActionsController } from './user-accounts-actions.controller';

describe('UserAccountsActionsController', () => {
  let controller: UserAccountsActionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserAccountsActionsController],
    }).compile();

    controller = module.get<UserAccountsActionsController>(
      UserAccountsActionsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
