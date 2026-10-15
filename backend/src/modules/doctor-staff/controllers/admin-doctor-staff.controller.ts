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
import type { AuthActor } from '../../../common/types/auth-actor';
import { UserType } from '../../../database/enums';
import { ResetPasswordDto } from '../../doctor/dtos/reset-password.dto';
import {
  CreateDoctorStaffDto,
  DoctorStaffListQueryDto,
  DoctorStaffResponseDto,
  UpdateDoctorStaffDto,
} from '../dtos/admin-doctor-staff.dto';
import { AdminDoctorStaffService } from '../services/admin-doctor-staff.service';

@ApiTags('Admin / Doctor staff')
@ApiBearerAuth()
@Roles(UserType.ADMIN)
@Controller('api/admin/doctor-staff')
export class AdminDoctorStaffController {
  constructor(private readonly service: AdminDoctorStaffService) {}

  @Get()
  @ApiOperation({ summary: 'List doctor staff' })
  @ApiPaginatedResponse(DoctorStaffResponseDto)
  list(@Query() query: DoctorStaffListQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a doctor staff member' })
  @ApiOkResponse({ type: DoctorStaffResponseDto })
  get(@Param('id', ParseIntPipe) id: number) {
    return this.service.get(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a doctor staff member with a login account',
  })
  @ApiCreatedResponse({ type: DoctorStaffResponseDto })
  create(@Body() dto: CreateDoctorStaffDto, @Actor() actor: AuthActor) {
    return this.service.create(dto, actor);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a doctor staff member' })
  @ApiOkResponse({ type: DoctorStaffResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDoctorStaffDto,
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
}
