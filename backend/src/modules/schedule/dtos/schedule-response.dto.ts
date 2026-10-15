import { ApiProperty } from '@nestjs/swagger';
import { ChamberType } from '../../../database/enums';
import { ChamberRefDto } from '../../chamber/dtos/chamber-ref.dto';
import { ChamberResourceDto } from '../../chamber/dtos/chamber-response.dto';

export class OffDateDto {
  @ApiProperty() id: number;
  @ApiProperty({ example: '2026-10-20' }) date: string;
  @ApiProperty({ type: String, nullable: true }) reason: string | null;
  @ApiProperty({ type: String, nullable: true }) reasonBN: string | null;
}

export class CreatedOffDateDto extends OffDateDto {
  @ApiProperty() cancelledAppointments: number;
}

export class DailyOffDateDto {
  @ApiProperty() id: number;
  @ApiProperty({ type: String, nullable: true }) reason: string | null;
  @ApiProperty({ type: String, nullable: true }) reasonBN: string | null;
}

export class DailyDoctorRefDto extends ChamberRefDto {
  @ApiProperty({ type: ChamberRefDto, nullable: true })
  speciality: ChamberRefDto | null;
}

export class DailyChamberRefDto {
  @ApiProperty() id: number;
  @ApiProperty({ type: String, nullable: true }) name: string | null;
  @ApiProperty({ type: String, nullable: true }) nameBN: string | null;
  @ApiProperty({ enum: ChamberType }) chamberType: ChamberType;
  @ApiProperty({ type: ChamberRefDto, nullable: true })
  hospital: ChamberRefDto | null;
  @ApiProperty() address: string;
}

export class DailyTurnDto {
  @ApiProperty() turnId: number;
  @ApiProperty() startTime: string;
  @ApiProperty() endTime: string;
  @ApiProperty() fee: number;
  @ApiProperty() slotDurationMinutes: number;
  @ApiProperty() capacity: number;
  @ApiProperty() booked: number;
  @ApiProperty() remaining: number;
}

export class DailyChamberDto {
  @ApiProperty({ type: DailyChamberRefDto }) chamber: DailyChamberRefDto;
  @ApiProperty() isOff: boolean;
  @ApiProperty({ type: [DailyTurnDto] }) turns: DailyTurnDto[];
}

export class DailyDoctorDto {
  @ApiProperty({ type: DailyDoctorRefDto }) doctor: DailyDoctorRefDto;
  @ApiProperty({ type: DailyOffDateDto, nullable: true })
  offDate: DailyOffDateDto | null;
  @ApiProperty({ type: [DailyChamberDto] }) chambers: DailyChamberDto[];
}

export class DailyScheduleDto {
  @ApiProperty() date: string;
  @ApiProperty({ minimum: 0, maximum: 6 }) weekday: number;
  @ApiProperty({ type: [DailyDoctorDto] }) doctors: DailyDoctorDto[];
}

export class ScheduleDoctorDto extends ChamberRefDto {
  @ApiProperty() consultationDurationMinutes: number;
}

export class DoctorScheduleOverviewDto {
  @ApiProperty({ type: ScheduleDoctorDto }) doctor: ScheduleDoctorDto;
  @ApiProperty({ type: [ChamberResourceDto] }) chambers: ChamberResourceDto[];
  @ApiProperty({ type: [OffDateDto], description: 'Today onward' })
  offDates: OffDateDto[];
}
