import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Actor } from '../../../common/decorators/actor.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ApiPaginatedResponse } from '../../../common/dto/paginated';
import type { AuthActor } from '../../../common/types/auth-actor';
import { UserType } from '../../../database/enums';
import { ChamberQueryDto } from '../dtos/chamber-query.dto';
import {
  ChamberListItemDto,
  ChamberResourceDto,
} from '../dtos/chamber-response.dto';
import { ReplaceScheduleDto } from '../dtos/chamber-schedule-input.dto';
import { CreateChamberDto } from '../dtos/create-chamber.dto';
import { UpdateChamberDto } from '../dtos/update-chamber.dto';
import { AdminChamberService } from '../services/admin-chamber.service';

@ApiTags('Admin / Chamber')
@ApiBearerAuth()
@Roles(UserType.ADMIN)
@Controller('api/admin/chamber')
export class AdminChamberController {
  constructor(private readonly service: AdminChamberService) {}

  @Get()
  @ApiOperation({ summary: 'List chambers' })
  @ApiPaginatedResponse(ChamberListItemDto)
  list(@Query() query: ChamberQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chamber with its 7-day schedule' })
  @ApiOkResponse({ type: ChamberResourceDto })
  get(@Param('id', ParseIntPipe) id: number) {
    return this.service.get(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a chamber, optionally with a schedule' })
  @ApiCreatedResponse({ type: ChamberResourceDto })
  create(@Actor() actor: AuthActor, @Body() dto: CreateChamberDto) {
    return this.service.create(actor, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update chamber basic info' })
  @ApiOkResponse({ type: ChamberResourceDto })
  update(
    @Actor() actor: AuthActor,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateChamberDto,
  ) {
    return this.service.update(actor, id, dto);
  }

  @Put(':id/schedule')
  @ApiOperation({ summary: 'Replace the weekly schedule of a chamber' })
  @ApiOkResponse({ type: ChamberResourceDto })
  replaceSchedule(
    @Actor() actor: AuthActor,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReplaceScheduleDto,
  ) {
    return this.service.replaceSchedule(actor, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Soft-delete a chamber' })
  @ApiNoContentResponse()
  remove(@Actor() actor: AuthActor, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(actor, id);
  }
}
