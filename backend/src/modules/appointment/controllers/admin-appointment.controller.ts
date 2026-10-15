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
import type { AuthActor } from '../../../common/types/auth-actor';
import { UserType } from '../../../database/enums';
import {
  BookAppointmentDto,
  CancelAppointmentDto,
  UpdateAppointmentStatusDto,
} from '../dtos/appointment-body.dto';
import {
  AppointmentListQueryDto,
  AvailabilityQueryDto,
  SlotsQueryDto,
} from '../dtos/appointment-query.dto';
import {
  AppointmentDetailDto,
  AppointmentListPageDto,
  AppointmentSummaryDto,
  AvailabilityDto,
  SlotsDto,
} from '../dtos/appointment-response.dto';
import { AdminAppointmentService } from '../services/admin-appointment.service';

@ApiTags('Admin / Appointment')
@ApiBearerAuth()
@Roles(UserType.ADMIN)
@Controller('api/admin/appointment')
export class AdminAppointmentController {
  constructor(private readonly service: AdminAppointmentService) {}

  @Get()
  @ApiOperation({ summary: 'List appointments' })
  @ApiOkResponse({ type: AppointmentListPageDto })
  list(@Query() query: AppointmentListQueryDto) {
    return this.service.list(query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Dashboard counts and recent appointments' })
  @ApiOkResponse({ type: AppointmentSummaryDto })
  summary() {
    return this.service.summary();
  }

  @Get('availability')
  @ApiOperation({
    summary: 'Chamber availability for a date range (max 31 days)',
  })
  @ApiOkResponse({ type: AvailabilityDto })
  availability(@Query() query: AvailabilityQueryDto) {
    return this.service.getAvailability(query);
  }

  @Get('slots')
  @ApiOperation({ summary: 'Slots of a turn on a date with booking state' })
  @ApiOkResponse({ type: SlotsDto })
  slots(@Query() query: SlotsQueryDto) {
    return this.service.getSlots(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Appointment detail with status log' })
  @ApiOkResponse({ type: AppointmentDetailDto })
  get(@Param('id', ParseIntPipe) id: number) {
    return this.service.get(id);
  }

  @Post()
  @ApiOperation({ summary: 'Book an appointment on behalf of a patient' })
  @ApiCreatedResponse({ type: AppointmentDetailDto })
  book(@Actor() actor: AuthActor, @Body() dto: BookAppointmentDto) {
    return this.service.book(actor, dto);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancel a scheduled appointment' })
  @ApiOkResponse({ type: AppointmentDetailDto })
  cancel(
    @Actor() actor: AuthActor,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelAppointmentDto,
  ) {
    return this.service.cancel(actor, id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Mark a scheduled appointment completed or no-show',
  })
  @ApiOkResponse({ type: AppointmentDetailDto })
  changeStatus(
    @Actor() actor: AuthActor,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAppointmentStatusDto,
  ) {
    return this.service.changeStatus(actor, id, dto);
  }
}
