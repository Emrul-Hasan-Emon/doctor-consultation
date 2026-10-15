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
  CreateSpecialityDto,
  SpecialityDto,
  SpecialityListQueryDto,
  UpdateSpecialityDto,
} from '../dtos/speciality.dto';
import { AdminSpecialityService } from '../services/admin-speciality.service';

@ApiTags('Admin / Speciality')
@ApiBearerAuth()
@Roles(UserType.ADMIN)
@Controller('api/admin/speciality')
export class AdminSpecialityController {
  constructor(private readonly service: AdminSpecialityService) {}

  @Get()
  @ApiOperation({ summary: 'List specialities' })
  @ApiPaginatedResponse(SpecialityDto)
  list(@Query() query: SpecialityListQueryDto) {
    return this.service.list(query);
  }

  @Get('options')
  @ApiOperation({ summary: 'All active specialities as short refs' })
  @ApiOkResponse({ type: [RefDto] })
  options() {
    return this.service.options();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a speciality' })
  @ApiOkResponse({ type: SpecialityDto })
  get(@Param('id', ParseIntPipe) id: number) {
    return this.service.get(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a speciality' })
  @ApiCreatedResponse({ type: SpecialityDto })
  create(@Body() dto: CreateSpecialityDto, @Actor() actor: AuthActor) {
    return this.service.create(dto, actor);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a speciality' })
  @ApiOkResponse({ type: SpecialityDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSpecialityDto,
    @Actor() actor: AuthActor,
  ) {
    return this.service.update(id, dto, actor);
  }
}
