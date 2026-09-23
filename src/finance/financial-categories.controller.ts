import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CreateFinancialCategoryDto } from './dto/create-financial-category.dto';
import { UpdateFinancialCategoryDto } from './dto/update-financial-category.dto';
import { FinancialCategoriesService } from './financial-categories.service';

@ApiTags('finance')
@Controller('financial-categories')
export class FinancialCategoriesController {
  constructor(private readonly categoriesService: FinancialCategoriesService) {}

  @Post()
  @Permissions('financial_category.manage')
  @ApiOperation({ summary: 'Crea una categoría contable (ingreso/gasto)' })
  create(@Body() dto: CreateFinancialCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista categorías contables' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una categoría contable' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('financial_category.manage')
  @ApiOperation({ summary: 'Actualiza una categoría contable' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFinancialCategoryDto,
  ) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('financial_category.manage')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Elimina una categoría (falla si tiene transacciones)',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.categoriesService.remove(id);
  }
}
