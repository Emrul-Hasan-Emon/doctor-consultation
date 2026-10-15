import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

const TIME = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export class ChamberTurnInputDto {
  @ApiPropertyOptional({ description: 'Existing turn id; omit to create' })
  @IsOptional()
  @IsInt()
  @Min(1)
  id?: number;

  @ApiProperty({ example: '09:00' })
  @Matches(TIME, { message: 'startTime must be HH:mm or HH:mm:ss' })
  startTime: string;

  @ApiProperty({ example: '12:00' })
  @Matches(TIME, { message: 'endTime must be HH:mm or HH:mm:ss' })
  endTime: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  @Max(1000)
  maxPatients: number;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  fee: number;

  @ApiPropertyOptional({
    description: "Defaults to the doctor's consultationDurationMinutes",
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(240)
  slotDurationMinutes?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ChamberDayInputDto {
  @ApiProperty({
    minimum: 0,
    maximum: 6,
    description: '0=Saturday ... 6=Friday',
  })
  @IsInt()
  @Min(0)
  @Max(6)
  weekday: number;

  @ApiProperty()
  @IsBoolean()
  isOff: boolean;

  @ApiPropertyOptional({ type: [ChamberTurnInputDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ChamberTurnInputDto)
  turns?: ChamberTurnInputDto[];
}

export class ReplaceScheduleDto {
  @ApiProperty({ type: [ChamberDayInputDto] })
  @IsArray()
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => ChamberDayInputDto)
  days: ChamberDayInputDto[];
}
