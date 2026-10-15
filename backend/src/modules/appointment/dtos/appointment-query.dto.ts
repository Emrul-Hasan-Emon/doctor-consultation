import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Matches, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { AppointmentStatus } from '../../../database/enums';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_MSG = 'must be a date in YYYY-MM-DD format';

export class AppointmentListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsOptional()
  @Matches(DATE_RE, { message: `from ${DATE_MSG}` })
  from?: string;

  @ApiPropertyOptional({ example: '2026-10-31' })
  @IsOptional()
  @Matches(DATE_RE, { message: `to ${DATE_MSG}` })
  to?: string;

  @ApiPropertyOptional({ example: '2026-10-08', description: 'Exact date' })
  @IsOptional()
  @Matches(DATE_RE, { message: `date ${DATE_MSG}` })
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  doctorId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  patientId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  chamberId?: number;

  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}

export class AvailabilityQueryDto {
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

  @ApiProperty({ example: '2026-10-08' })
  @Matches(DATE_RE, { message: `from ${DATE_MSG}` })
  from: string;

  @ApiProperty({
    example: '2026-10-14',
    description: 'At most 31 days from `from`',
  })
  @Matches(DATE_RE, { message: `to ${DATE_MSG}` })
  to: string;
}

export class SlotsQueryDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  turnId: number;

  @ApiProperty({ example: '2026-10-08' })
  @Matches(DATE_RE, { message: `date ${DATE_MSG}` })
  date: string;
}
