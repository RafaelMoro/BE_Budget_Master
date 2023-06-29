import { Controller, UseGuards, Post, Body, Get } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CategoriesService } from '../services/categories.service';
import { CreateCategoriesDto } from '../dtos/categories.dto';

@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  getCategories() {
    return this.categoriesService.findAll();
  }

  @Post()
  createCategory(@Body() payload: CreateCategoriesDto) {
    return this.categoriesService.createOne(payload);
  }
}
