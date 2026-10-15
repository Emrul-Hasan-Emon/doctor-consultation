import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { IsBdMobile } from '../../../common/validators/is-bd-mobile.decorator';
import { ActorType } from '../../../database/enums';
import { RefDto } from '../../doctor/dtos/ref.dto';
import { toBoolean } from '../../doctor/utils/query-transform';

export class CreatePatientDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(255) name: string;

  @IsOptional() @IsString() @MaxLength(255) nameBN?: string | null;

  @ApiProperty({ example: '01990000003' })
  @IsBdMobile()
  mobile: string;

  @ApiProperty() @Type(() => Number) @IsInt() divisionId: number;

  @ApiProperty() @Type(() => Number) @IsInt() districtId: number;

  @IsOptional() @IsString() address?: string | null;

  @IsOptional() @IsString() addressBN?: string | null;

  @ApiProperty({ type: [Number], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsInt({ each: true })
  doctorIds: number[];
}

export class UpdatePatientDto extends PartialType(
  OmitType(CreatePatientDto, ['doctorIds'] as const),
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class PatientListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  divisionId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  districtId?: number;

  @ApiPropertyOptional({ description: 'Linked (active link) doctor' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  doctorId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isActive?: boolean;
}

export class SetPatientDoctorsDto {
  @ApiProperty({ type: [Number], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsInt({ each: true })
  doctorIds: number[];
}

export class AddPatientDoctorDto {
  @ApiProperty() @Type(() => Number) @IsInt() doctorId: number;
}

export class PatientDoctorRefDto {
  @ApiProperty() doctorId: number;
  @ApiProperty() name: string;
  @ApiProperty({ type: String, nullable: true }) nameBN: string | null;
}

export class PatientResponseDto {
  @ApiProperty() id: number;
  @ApiProperty() accountId: number;
  @ApiProperty() name: string;
  @ApiProperty({ type: String, nullable: true }) nameBN: string | null;
  @ApiProperty() mobile: string;
  @ApiProperty() divisionId: number;
  @ApiProperty() districtId: number;
  @ApiProperty({ type: RefDto }) division: RefDto;
  @ApiProperty({ type: RefDto }) district: RefDto;
  @ApiProperty({ type: String, nullable: true }) address: string | null;
  @ApiProperty({ type: String, nullable: true }) addressBN: string | null;
  @ApiProperty() isActive: boolean;
  @ApiProperty({ enum: ActorType }) createdByType: ActorType;
  @ApiProperty({ type: [PatientDoctorRefDto] }) doctors: PatientDoctorRefDto[];
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class PatientDoctorItemDto {
  @ApiProperty() linkId: number;
  @ApiProperty() doctorId: number;
  @ApiProperty() name: string;
  @ApiProperty({ type: String, nullable: true }) nameBN: string | null;
  @ApiProperty() mobile: string;
  @ApiProperty({ type: RefDto, nullable: true }) speciality: RefDto | null;
  @ApiProperty() isActive: boolean;
  @ApiProperty() linkedAt: Date;
}
