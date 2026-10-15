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
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Actor } from '../../../common/decorators/actor.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { ApiPaginatedResponse } from '../../../common/dto/paginated';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import type { AuthActor } from '../../../common/types/auth-actor';
import { UserType } from '../../../database/enums';
import {
  CreateDoctorDto,
  DoctorListItemDto,
  DoctorListQueryDto,
  DoctorOptionDto,
  DoctorOptionsQueryDto,
  DoctorPatientItemDto,
  DoctorResponseDto,
  UpdateDoctorDto,
} from '../dtos/admin-doctor.dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { AdminDoctorService } from '../services/admin-doctor.service';

@ApiTags('Admin / Doctor')
@ApiBearerAuth()
@Roles(UserType.ADMIN)
@Controller('api/admin/doctor')
export class AdminDoctorController {
  constructor(private readonly service: AdminDoctorService) {}

  @Get()
  @ApiOperation({ summary: 'List doctors' })
  @ApiPaginatedResponse(DoctorListItemDto)
  list(@Query() query: DoctorListQueryDto) {
    return this.service.list(query);
  }

  @Get('options')
  @ApiOperation({ summary: 'Active doctors for pickers (max 50)' })
  @ApiOkResponse({ type: [DoctorOptionDto] })
  options(@Query() query: DoctorOptionsQueryDto) {
    return this.service.options(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a doctor' })
  @ApiOkResponse({ type: DoctorResponseDto })
  get(@Param('id', ParseIntPipe) id: number) {
    return this.service.get(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a doctor with a login account' })
  @ApiCreatedResponse({ type: DoctorResponseDto })
  create(@Body() dto: CreateDoctorDto, @Actor() actor: AuthActor) {
    return this.service.create(dto, actor);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a doctor' })
  @ApiOkResponse({ type: DoctorResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDoctorDto,
    @Actor() actor: AuthActor,
  ) {
    return this.service.update(id, dto, actor);
  }

  @Post(':id/reset-password')
  @HttpCode(204)
  @ApiOperation({ summary: 'Set a new password and revoke sessions' })
  @ApiNoContentResponse()
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetPasswordDto,
    @Actor() actor: AuthActor,
  ) {
    await this.service.resetPassword(id, dto.password, actor);
  }

  @Get(':id/patients')
  @ApiOperation({ summary: "List a doctor's active patients" })
  @ApiPaginatedResponse(DoctorPatientItemDto)
  listPatients(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.listPatients(id, query);
  }
}
