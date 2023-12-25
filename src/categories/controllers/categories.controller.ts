import {
  Controller,
  UseGuards,
  Post,
  Body,
  Get,
  Request,
  Put,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CategoriesService } from '../services/categories.service';
import {
  CreateCategoriesDto,
  DeleteCategoryDto,
  UpdateCategoriesDto,
} from '../dtos/categories.dto';

@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  getCategories(@Request() req) {
    const userId = req.user.sub;
    return this.categoriesService.findbyUser(userId);
  }

  @Post()
  createCategory(@Body() payload: CreateCategoriesDto, @Request() req) {
    const userId = req.user.sub;
    return this.categoriesService.createOneCategory(payload, userId);
  }

  @Put()
  updateCategory(@Body() payload: UpdateCategoriesDto) {
    return this.categoriesService.updateCategory(payload);
  }

  @Delete()
  removeIncome(@Body() payload: DeleteCategoryDto) {
    return this.categoriesService.removeCategory(payload);
  }
}
