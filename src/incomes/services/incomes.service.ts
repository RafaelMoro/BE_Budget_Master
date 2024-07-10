import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateIncome } from '../incomes.entity';
import { Model } from 'mongoose';
import { CategoriesService } from '../../categories/services/categories.service';

@Injectable()
export class IncomesService {
  constructor(
    @InjectModel(CreateIncome.name) private incomeModel: Model<CreateIncome>,
    private categoriesService: CategoriesService,
  ) {}
}
