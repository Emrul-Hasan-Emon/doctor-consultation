import { ApiProperty } from '@nestjs/swagger';
import { ChamberType } from '../../../database/enums';
import { ChamberRefDto } from './chamber-ref.dto';

export class ChamberTurnDto {
  @ApiProperty() id: number;
  @ApiProperty({ example: '09:00:00' }) startTime: string;
  @ApiProperty({ example: '12:00:00' }) endTime: string;
  @ApiProperty() maxPatients: number;
  @ApiProperty() fee: number;
  @ApiProperty() slotDurationMinutes: number;
  @ApiProperty() isActive: boolean;
  @ApiProperty() sortOrder: number;
  @ApiProperty({ description: 'Bookable slots' }) slotCapacity: number;
}

export class ChamberDayDto {
  @ApiProperty({ minimum: 0, maximum: 6 }) weekday: number;
  @ApiProperty() isOff: boolean;
  @ApiProperty({ type: [ChamberTurnDto] }) turns: ChamberTurnDto[];
}

export class ChamberResourceDto {
  @ApiProperty() id: number;
  @ApiProperty() doctorId: number;
  @ApiProperty({ type: ChamberRefDto }) doctor: ChamberRefDto;
  @ApiProperty({ type: String, nullable: true }) name: string | null;
  @ApiProperty({ type: String, nullable: true }) nameBN: string | null;
  @ApiProperty({ enum: ChamberType }) chamberType: ChamberType;
  @ApiProperty({ type: Number, nullable: true }) hospitalId: number | null;
  @ApiProperty({ type: ChamberRefDto, nullable: true })
  hospital: ChamberRefDto | null;
  @ApiProperty() divisionId: number;
  @ApiProperty() districtId: number;
  @ApiProperty({ type: ChamberRefDto }) division: ChamberRefDto;
  @ApiProperty({ type: ChamberRefDto }) district: ChamberRefDto;
  @ApiProperty() address: string;
  @ApiProperty({ type: String, nullable: true }) addressBN: string | null;
  @ApiProperty({ type: String, nullable: true }) description: string | null;
  @ApiProperty({ type: String, nullable: true }) descriptionBN: string | null;
  @ApiProperty() advanceBookingDays: number;
  @ApiProperty() isActive: boolean;
  @ApiProperty({ type: [ChamberDayDto], description: 'Always 7 days' })
  days: ChamberDayDto[];
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class ChamberListItemDto {
  @ApiProperty() id: number;
  @ApiProperty({ type: String, nullable: true }) name: string | null;
  @ApiProperty({ type: String, nullable: true }) nameBN: string | null;
  @ApiProperty({ enum: ChamberType }) chamberType: ChamberType;
  @ApiProperty({ type: ChamberRefDto }) doctor: ChamberRefDto;
  @ApiProperty({ type: ChamberRefDto, nullable: true })
  hospital: ChamberRefDto | null;
  @ApiProperty({ type: ChamberRefDto }) division: ChamberRefDto;
  @ApiProperty({ type: ChamberRefDto }) district: ChamberRefDto;
  @ApiProperty() address: string;
  @ApiProperty() isActive: boolean;
  @ApiProperty({ type: [Number] }) openDays: number[];
}
