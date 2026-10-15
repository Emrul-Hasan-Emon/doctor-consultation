import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PrescriptionType } from '../../../database/enums';

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateSpecialityDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(255) name: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nameBN?: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  titleBN?: string | null;

  @ApiProperty({
    description: 'Unique slug: lowercase letters, digits and hyphens',
    example: 'general-medicine',
  })
  @IsString()
  @MaxLength(255)
  @Matches(SLUG_PATTERN, {
    message: 'value must be a lowercase slug (letters, digits, hyphens)',
  })
  value: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  icon?: string | null;

  @ApiProperty({ enum: PrescriptionType })
  @IsEnum(PrescriptionType)
  prescriptionType: PrescriptionType;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSpecialityDto extends PartialType(CreateSpecialityDto) {}

export class SpecialityListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  @IsBoolean()
  isActive?: boolean;
}

export class SpecialityDto {
  @ApiProperty() id: number;
  @ApiProperty() name: string;
  @ApiProperty({ nullable: true, type: String }) nameBN: string | null;
  @ApiProperty({ nullable: true, type: String }) title: string | null;
  @ApiProperty({ nullable: true, type: String }) titleBN: string | null;
  @ApiProperty() value: string;
  @ApiProperty({ nullable: true, type: String }) icon: string | null;
  @ApiProperty({ enum: PrescriptionType })
  prescriptionType: PrescriptionType;
  @ApiProperty() isActive: boolean;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}
