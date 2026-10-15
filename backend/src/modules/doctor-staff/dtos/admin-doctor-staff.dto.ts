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
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { IsBdMobile } from '../../../common/validators/is-bd-mobile.decorator';
import { RefDto } from '../../doctor/dtos/ref.dto';
import { toBoolean } from '../../doctor/utils/query-transform';

export class CreateDoctorStaffDto {
  @ApiProperty() @Type(() => Number) @IsInt() doctorId: number;

  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(255) name: string;

  @IsOptional() @IsString() @MaxLength(255) nameBN?: string | null;

  @ApiProperty({ example: '01990000002' })
  @IsBdMobile()
  mobile: string;

  @IsOptional() @IsEmail() @MaxLength(255) email?: string | null;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}

export class UpdateDoctorStaffDto extends PartialType(
  OmitType(CreateDoctorStaffDto, ['doctorId', 'password'] as const),
) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class DoctorStaffListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
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

export class DoctorStaffResponseDto {
  @ApiProperty() id: number;
  @ApiProperty() accountId: number;
  @ApiProperty() doctorId: number;
  @ApiProperty({ type: RefDto }) doctor: RefDto;
  @ApiProperty() name: string;
  @ApiProperty({ type: String, nullable: true }) nameBN: string | null;
  @ApiProperty() mobile: string;
  @ApiProperty({ type: String, nullable: true }) email: string | null;
  @ApiProperty() isActive: boolean;
  @ApiProperty() createdAt: Date;
}
