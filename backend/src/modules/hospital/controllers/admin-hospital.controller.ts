import {
  Body,
  Controller,
  Get,
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
import { RefDto } from '../../location/dtos/location.dto';
import {
  CreateHospitalDto,
  HospitalDto,
  HospitalListQueryDto,
  UpdateHospitalDto,
} from '../dtos/hospital.dto';
import { AdminHospitalService } from '../services/admin-hospital.service';

@ApiTags('Admin / Hospital')
@ApiBearerAuth()
@Roles(UserType.ADMIN)
@Controller('api/admin/hospital')
export class AdminHospitalController {
  constructor(private readonly service: AdminHospitalService) {}

  @Get()
  @ApiOperation({ summary: 'List hospitals' })
  @ApiPaginatedResponse(HospitalDto)
  list(@Query() query: HospitalListQueryDto) {
    return this.service.list(query);
  }

  @Get('options')
  @ApiOperation({ summary: 'All active hospitals as short refs' })
  @ApiOkResponse({ type: [RefDto] })
  options() {
    return this.service.options();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a hospital' })
  @ApiOkResponse({ type: HospitalDto })
  get(@Param('id', ParseIntPipe) id: number) {
    return this.service.get(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a hospital' })
  @ApiCreatedResponse({ type: HospitalDto })
  create(@Body() dto: CreateHospitalDto, @Actor() actor: AuthActor) {
    return this.service.create(dto, actor);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a hospital' })
  @ApiOkResponse({ type: HospitalDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHospitalDto,
    @Actor() actor: AuthActor,
  ) {
    return this.service.update(id, dto, actor);
  }
}
