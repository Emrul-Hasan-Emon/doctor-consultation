import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { AppointmentStatus } from '../../../database/enums';

export class BookAppointmentDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  patientId: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  doctorId: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  chamberId: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  turnId: number;

  @ApiProperty({ example: '2026-10-08' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be a date in YYYY-MM-DD format',
  })
  date: string;

  @ApiPropertyOptional({ description: 'First free slot when omitted' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  slotNumber?: number;
}

export class CancelAppointmentDto {
  @ApiPropertyOptional({ maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}

export class UpdateAppointmentStatusDto {
  @ApiProperty({
    enum: [AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW],
  })
  @IsIn([AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW])
  status: AppointmentStatus.COMPLETED | AppointmentStatus.NO_SHOW;
}
