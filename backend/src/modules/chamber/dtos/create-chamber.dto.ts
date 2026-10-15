import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ChamberType } from '../../../database/enums';
import { ChamberDayInputDto } from './chamber-schedule-input.dto';

export class CreateChamberDto {
  @ApiProperty()
  @IsInt()
  @Min(1)
  doctorId: number;

  @ApiProperty({ enum: ChamberType })
  @IsEnum(ChamberType)
  chamberType: ChamberType;

  @ApiPropertyOptional({
    description: 'Required for HOSPITAL, forbidden for SELF',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  hospitalId?: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  divisionId: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  districtId: number;

  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  address: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nameBN?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  addressBN?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  descriptionBN?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 365, default: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  advanceBookingDays?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [ChamberDayInputDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => ChamberDayInputDto)
  days?: ChamberDayInputDto[];
}
