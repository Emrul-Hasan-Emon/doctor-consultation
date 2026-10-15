import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ChamberType } from '../../../database/enums';

/** Basic info only. The schedule changes through PUT /:id/schedule. Send null to clear a nullable field. */
export class UpdateChamberDto {
  @ApiPropertyOptional({ enum: ChamberType })
  @IsOptional()
  @IsEnum(ChamberType)
  chamberType?: ChamberType;

  @ApiPropertyOptional({ nullable: true, type: Number })
  @IsOptional()
  @IsInt()
  @Min(1)
  hospitalId?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  divisionId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  districtId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  address?: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nameBN?: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  addressBN?: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  descriptionBN?: string | null;

  @ApiPropertyOptional({ minimum: 1, maximum: 365 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  advanceBookingDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
