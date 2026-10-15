import { ApiProperty } from '@nestjs/swagger';
import { PageMeta } from '../../../common/dto/paginated';
import {
  ActorType,
  AppointmentCategory,
  AppointmentStatus,
  ChamberType,
} from '../../../database/enums';

export class RefDto {
  @ApiProperty() id: number;
  @ApiProperty() name: string;
  @ApiProperty({ nullable: true, type: String }) nameBN: string | null;
}

export class AppointmentPatientDto extends RefDto {
  @ApiProperty() mobile: string;
}

export class AppointmentChamberDto extends RefDto {
  @ApiProperty({ enum: ChamberType }) chamberType: ChamberType;
  @ApiProperty({ type: RefDto, nullable: true }) hospital: RefDto | null;
}

export class AppointmentListItemDto {
  @ApiProperty() id: number;
  @ApiProperty({ example: '2026-10-08' }) appointmentDate: string;
  @ApiProperty() slotNumber: number;
  @ApiProperty({ example: '10:00:00' }) slotStartTime: string;
  @ApiProperty({ example: '10:15:00' }) slotEndTime: string;
  @ApiProperty({ enum: AppointmentStatus }) status: AppointmentStatus;
  @ApiProperty({ enum: AppointmentCategory }) category: AppointmentCategory;
  @ApiProperty() fee: number;
  @ApiProperty({ type: AppointmentPatientDto }) patient: AppointmentPatientDto;
  @ApiProperty({ type: RefDto }) doctor: RefDto;
  @ApiProperty({ type: AppointmentChamberDto })
  chamber: AppointmentChamberDto;
  @ApiProperty({ enum: ActorType }) bookedByType: ActorType;
  @ApiProperty() createdAt: Date;
}

export class AppointmentListPageDto {
  @ApiProperty({ type: [AppointmentListItemDto] })
  items: AppointmentListItemDto[];
  @ApiProperty({ type: PageMeta }) meta: PageMeta;
}

export class AppointmentPatientDetailsDto {
  @ApiProperty() fullName: string;
  @ApiProperty({ required: false }) mobile?: string;
  @ApiProperty({ required: false }) gender?: string;
  @ApiProperty({ required: false }) age?: number;
  @ApiProperty({ required: false }) weight?: number;
  @ApiProperty({ required: false }) height?: number;
}

export class AppointmentTurnRefDto {
  @ApiProperty() id: number;
  @ApiProperty({ example: '10:00:00' }) startTime: string;
  @ApiProperty({ example: '12:00:00' }) endTime: string;
}

export class AppointmentStatusLogDto {
  @ApiProperty({ enum: AppointmentStatus, nullable: true })
  fromStatus: AppointmentStatus | null;
  @ApiProperty({ enum: AppointmentStatus }) toStatus: AppointmentStatus;
  @ApiProperty({ enum: ActorType }) actorType: ActorType;
  @ApiProperty() actorId: number;
  @ApiProperty({ nullable: true, type: String }) reason: string | null;
  @ApiProperty() createdAt: Date;
}

export class AppointmentDetailDto extends AppointmentListItemDto {
  @ApiProperty({ type: AppointmentPatientDetailsDto, nullable: true })
  patientDetails: AppointmentPatientDetailsDto | null;
  @ApiProperty() durationMinutes: number;
  @ApiProperty({ type: AppointmentTurnRefDto })
  chamberTurn: AppointmentTurnRefDto;
  @ApiProperty({ nullable: true, type: Date }) cancelledAt: Date | null;
  @ApiProperty({ nullable: true, type: String }) cancelReason: string | null;
  @ApiProperty({ enum: ActorType, nullable: true })
  cancelledByType: ActorType | null;
  @ApiProperty({ nullable: true, type: Date }) completedAt: Date | null;
  @ApiProperty({ type: [AppointmentStatusLogDto] })
  statusLog: AppointmentStatusLogDto[];
}

export class AppointmentTodayDto {
  @ApiProperty() total: number;
  @ApiProperty() scheduled: number;
  @ApiProperty() completed: number;
  @ApiProperty() cancelled: number;
  @ApiProperty() noShow: number;
}

export class AppointmentSummaryDto {
  @ApiProperty() doctors: number;
  @ApiProperty() patients: number;
  @ApiProperty() hospitals: number;
  @ApiProperty() activeChambers: number;
  @ApiProperty({ type: AppointmentTodayDto }) today: AppointmentTodayDto;
  @ApiProperty({
    description: 'SCHEDULED appointments from tomorrow to +7 days',
  })
  next7Days: number;
  @ApiProperty({ type: [AppointmentListItemDto] })
  recent: AppointmentListItemDto[];
}

export class AvailabilityTurnDto {
  @ApiProperty() turnId: number;
  @ApiProperty({ example: '10:00:00' }) startTime: string;
  @ApiProperty({ example: '12:00:00' }) endTime: string;
  @ApiProperty() fee: number;
  @ApiProperty() slotDurationMinutes: number;
  @ApiProperty() capacity: number;
  @ApiProperty() booked: number;
  @ApiProperty() remaining: number;
}

export class AvailabilityDayDto {
  @ApiProperty({ example: '2026-10-08' }) date: string;
  @ApiProperty({ description: '0=Saturday ... 6=Friday' }) weekday: number;
  @ApiProperty() isOpen: boolean;
  @ApiProperty({
    nullable: true,
    type: String,
    enum: [
      'DOCTOR_OFF',
      'CHAMBER_OFF',
      'NO_TURNS',
      'PAST',
      'OUT_OF_WINDOW',
      null,
    ],
  })
  closedReason: string | null;
  @ApiProperty({ type: [AvailabilityTurnDto] }) turns: AvailabilityTurnDto[];
}

export class AvailabilityDto {
  @ApiProperty({ type: [AvailabilityDayDto] }) days: AvailabilityDayDto[];
}

export class SlotAppointmentDto {
  @ApiProperty() id: number;
  @ApiProperty({ enum: AppointmentStatus }) status: AppointmentStatus;
  @ApiProperty() patientName: string;
  @ApiProperty({ nullable: true, type: String }) patientMobile: string | null;
}

export class SlotDto {
  @ApiProperty() slotNumber: number;
  @ApiProperty({ example: '10:00:00' }) startTime: string;
  @ApiProperty({ example: '10:15:00' }) endTime: string;
  @ApiProperty({ enum: ['FREE', 'BOOKED', 'PAST'] }) status: string;
  @ApiProperty({ type: SlotAppointmentDto, nullable: true })
  appointment: SlotAppointmentDto | null;
}

export class SlotsDto {
  @ApiProperty() turnId: number;
  @ApiProperty({ example: '2026-10-08' }) date: string;
  @ApiProperty({ type: [SlotDto] }) slots: SlotDto[];
}
