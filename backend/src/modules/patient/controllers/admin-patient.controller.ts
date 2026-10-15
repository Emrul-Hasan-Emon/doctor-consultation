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
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import type { AuthActor } from '../../../common/types/auth-actor';
import { UserType } from '../../../database/enums';
import {
  AddPatientDoctorDto,
  CreatePatientDto,
  PatientDoctorItemDto,
  PatientListQueryDto,
  PatientResponseDto,
  SetPatientDoctorsDto,
  UpdatePatientDto,
} from '../dtos/admin-patient.dto';
import { AdminPatientService } from '../services/admin-patient.service';

@ApiTags('Admin / Patient')
@ApiBearerAuth()
@Roles(UserType.ADMIN)
@Controller('api/admin/patient')
export class AdminPatientController {
  constructor(private readonly service: AdminPatientService) {}

  @Get()
  @ApiOperation({ summary: 'List patients' })
  @ApiPaginatedResponse(PatientResponseDto)
  list(@Query() query: PatientListQueryDto) {
    return this.service.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a patient' })
  @ApiOkResponse({ type: PatientResponseDto })
  get(@Param('id', ParseIntPipe) id: number) {
    return this.service.get(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a patient linked to doctors' })
  @ApiCreatedResponse({ type: PatientResponseDto })
  create(@Body() dto: CreatePatientDto, @Actor() actor: AuthActor) {
    return this.service.create(dto, actor);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a patient' })
  @ApiOkResponse({ type: PatientResponseDto })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePatientDto,
    @Actor() actor: AuthActor,
  ) {
    return this.service.update(id, dto, actor);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Soft delete a patient (409 if future scheduled appointments)',
  })
  @ApiNoContentResponse()
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Actor() actor: AuthActor,
  ) {
    await this.service.remove(id, actor);
  }

  @Get(':id/doctors')
  @ApiOperation({ summary: "List a patient's active doctors" })
  @ApiPaginatedResponse(PatientDoctorItemDto)
  listDoctors(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.listDoctors(id, query);
  }

  @Put(':id/doctors')
  @ApiOperation({ summary: "Replace the patient's active doctor set" })
  @ApiOkResponse({ type: PatientResponseDto })
  setDoctors(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetPatientDoctorsDto,
    @Actor() actor: AuthActor,
  ) {
    return this.service.setDoctors(id, dto.doctorIds, actor);
  }

  @Post(':id/doctors')
  @ApiOperation({ summary: 'Link one more doctor' })
  @ApiCreatedResponse({ type: PatientResponseDto })
  addDoctor(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddPatientDoctorDto,
    @Actor() actor: AuthActor,
  ) {
    return this.service.addDoctor(id, dto.doctorId, actor);
  }

  @Delete(':id/doctors/:doctorId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Unlink a doctor (409 if it is the last one)' })
  @ApiNoContentResponse()
  async removeDoctor(
    @Param('id', ParseIntPipe) id: number,
    @Param('doctorId', ParseIntPipe) doctorId: number,
    @Actor() actor: AuthActor,
  ) {
    await this.service.removeDoctor(id, doctorId, actor);
  }
}
