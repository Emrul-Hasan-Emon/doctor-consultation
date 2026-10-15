import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { IsBdMobile } from '../../../common/validators/is-bd-mobile.decorator';
import { toBoolean } from '../utils/query-transform';
import { RefDto } from './ref.dto';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export class CreateDoctorDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(255) name: string;

  @IsOptional() @IsString() @MaxLength(255) nameBN?: string | null;

  @ApiProperty({ example: '01990000001' })
  @IsBdMobile()
  mobile: string;

  @IsOptional() @IsEmail() @MaxLength(255) email?: string | null;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsOptional() @Type(() => Number) @IsInt() specialityId?: number | null;

  @IsOptional() @IsString() @MaxLength(255) degrees?: string | null;

  @IsOptional() @IsString() degreesBN?: string | null;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) experience?: number | null;

  @IsOptional() @IsString() @MaxLength(100) bmdcCode?: string | null;

  @ApiPropertyOptional({ example: '2030-12-31', nullable: true })
  @IsOptional()
  @Matches(DATE_RE, { message: 'bmdcExpiryDate must be YYYY-MM-DD' })
  bmdcExpiryDate?: string | null;

  @IsOptional() @IsString() @MaxLength(255) workingAt?: string | null;

  @IsOptional() @IsString() workingAtBN?: string | null;

  @IsOptional() @IsString() biography?: string | null;

  @IsOptional() @IsString() biographyBN?: string | null;

  @ApiPropertyOptional({ minimum: 1, maximum: 240, default: 15 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(240)
  consultationDurationMinutes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  defaultFollowUpDays?: number | null;

  @IsOptional() @IsString() @MaxLength(255) profilePic?: string | null;

  @IsOptional() @IsString() @MaxLength(255) signatureUrl?: string | null;
}

export class UpdateDoctorDto extends PartialType(
  OmitType(CreateDoctorDto, ['password'] as const),
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class DoctorListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  specialityId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isActive?: boolean;
}

export class DoctorOptionsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

export class DoctorOptionDto {
  @ApiProperty() id: number;
  @ApiProperty() name: string;
  @ApiProperty({ type: String, nullable: true }) nameBN: string | null;
  @ApiProperty({ type: String, nullable: true }) specialityName: string | null;
}

export class DoctorListItemDto {
  @ApiProperty() id: number;
  @ApiProperty() accountId: number;
  @ApiProperty() name: string;
  @ApiProperty({ type: String, nullable: true }) nameBN: string | null;
  @ApiProperty() mobile: string;
  @ApiProperty({ type: String, nullable: true }) email: string | null;
  @ApiProperty({ type: String, nullable: true }) profilePic: string | null;
  @ApiProperty({ type: String, nullable: true }) signatureUrl: string | null;
  @ApiProperty({ type: String, nullable: true }) degrees: string | null;
  @ApiProperty({ type: Number, nullable: true }) experience: number | null;
  @ApiProperty({ type: String, nullable: true }) bmdcCode: string | null;
  @ApiProperty({ type: String, nullable: true }) bmdcExpiryDate: string | null;
  @ApiProperty({ type: String, nullable: true }) workingAt: string | null;
  @ApiProperty() consultationDurationMinutes: number;
  @ApiProperty({ type: Number, nullable: true }) defaultFollowUpDays:
    number | null;
  @ApiProperty() isActive: boolean;
  @ApiProperty() accountActive: boolean;
  @ApiProperty({ type: Number, nullable: true }) specialityId: number | null;
  @ApiProperty({ type: RefDto, nullable: true }) speciality: RefDto | null;
  @ApiProperty() patientCount: number;
  @ApiProperty() staffCount: number;
  @ApiProperty() chamberCount: number;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class DoctorResponseDto extends DoctorListItemDto {
  @ApiProperty({ type: String, nullable: true }) degreesBN: string | null;
  @ApiProperty({ type: String, nullable: true }) workingAtBN: string | null;
  @ApiProperty({ type: String, nullable: true }) biography: string | null;
  @ApiProperty({ type: String, nullable: true }) biographyBN: string | null;
}

export class DoctorPatientItemDto {
  @ApiProperty() linkId: number;
  @ApiProperty() patientId: number;
  @ApiProperty() name: string;
  @ApiProperty({ type: String, nullable: true }) nameBN: string | null;
  @ApiProperty() mobile: string;
  @ApiProperty({ type: RefDto }) division: RefDto;
  @ApiProperty({ type: RefDto }) district: RefDto;
  @ApiProperty() linkedAt: Date;
}
