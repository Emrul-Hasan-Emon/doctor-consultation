import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
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
import type { AuthActor } from '../../../common/types/auth-actor';
import { UserType } from '../../../database/enums';
import { CreateOffDateDto } from '../dtos/create-off-date.dto';
import {
  DailyScheduleQueryDto,
  OffDateQueryDto,
} from '../dtos/schedule-query.dto';
import {
  CreatedOffDateDto,
  DailyScheduleDto,
  DoctorScheduleOverviewDto,
  OffDateDto,
} from '../dtos/schedule-response.dto';
import { AdminScheduleService } from '../services/admin-schedule.service';

@ApiTags('Admin / Schedule')
@ApiBearerAuth()
@Roles(UserType.ADMIN)
@Controller('api/admin/schedule')
export class AdminScheduleController {
  constructor(private readonly service: AdminScheduleService) {}

  @Get('daily')
  @ApiOperation({ summary: 'Who is available on a date, with booked counts' })
  @ApiOkResponse({ type: DailyScheduleDto })
  daily(@Query() query: DailyScheduleQueryDto) {
    return this.service.daily(query);
  }

  @Get('doctors/:doctorId')
  @ApiOperation({ summary: 'Doctor schedule overview: chambers and off dates' })
  @ApiOkResponse({ type: DoctorScheduleOverviewDto })
  doctor(@Param('doctorId', ParseIntPipe) doctorId: number) {
    return this.service.doctorOverview(doctorId);
  }

  @Get('doctors/:doctorId/off-dates')
  @ApiOperation({ summary: 'List doctor off dates' })
  @ApiOkResponse({ type: [OffDateDto] })
  listOffDates(
    @Param('doctorId', ParseIntPipe) doctorId: number,
    @Query() query: OffDateQueryDto,
  ) {
    return this.service.listOffDates(doctorId, query);
  }

  @Post('doctors/:doctorId/off-dates')
  @ApiOperation({
    summary: 'Mark a doctor off on a date, optionally cancelling appointments',
  })
  @ApiCreatedResponse({ type: CreatedOffDateDto })
  createOffDate(
    @Actor() actor: AuthActor,
    @Param('doctorId', ParseIntPipe) doctorId: number,
    @Body() dto: CreateOffDateDto,
  ) {
    return this.service.createOffDate(actor, doctorId, dto);
  }

  @Delete('doctors/:doctorId/off-dates/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove a doctor off date' })
  @ApiNoContentResponse()
  removeOffDate(
    @Actor() actor: AuthActor,
    @Param('doctorId', ParseIntPipe) doctorId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.service.removeOffDate(actor, doctorId, id);
  }
}
