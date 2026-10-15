import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Actor } from '../../../common/decorators/actor.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ApiPaginatedResponse } from '../../../common/dto/paginated';
import type { AuthActor } from '../../../common/types/auth-actor';
import { UserType } from '../../../database/enums';
import {
  CreateMedicineDto,
  ImportMedicinesDto,
  ImportMedicinesResultDto,
  MedicineDto,
  MedicineListQueryDto,
  UpdateMedicineDto,
} from '../dtos/medicine.dto';
import { AdminMedicineService } from '../services/admin-medicine.service';

@ApiTags('Admin / Medicine')
@ApiBearerAuth()
@Roles(UserType.ADMIN)
@Controller('api/admin/medicine')
export class AdminMedicineController {
  constructor(private readonly service: AdminMedicineService) {}

  @Get()
  @ApiOperation({ summary: 'List medicines (search brand or generic)' })
  @ApiPaginatedResponse(MedicineDto)
  list(@Query() query: MedicineListQueryDto) {
    return this.service.list(query);
  }

  @Post('import')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Bulk upsert medicines on sourceKey, with per-item errors',
  })
  @ApiOkResponse({ type: ImportMedicinesResultDto })
  import(@Body() dto: ImportMedicinesDto, @Actor() actor: AuthActor) {
    return this.service.import(dto.items, actor);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a medicine' })
  @ApiOkResponse({ type: MedicineDto })
  get(@Param('id', ParseIntPipe) id: number) {
    return this.service.get(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a medicine' })
  @ApiCreatedResponse({ type: MedicineDto })
  create(@Body() dto: CreateMedicineDto, @Actor() actor: AuthActor) {
    return this.service.create(dto, actor);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a medicine' })
  @ApiOkResponse({ type: MedicineDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMedicineDto,
    @Actor() actor: AuthActor,
  ) {
    return this.service.update(id, dto, actor);
  }
}
