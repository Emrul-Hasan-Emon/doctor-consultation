import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class CreateMedicineDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(255) manufacturer: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(255) brandName: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(1024) genericName: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  strength?: string | null;

  @ApiProperty({ example: 'Tablet' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  dosage: string;

  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(100) dar: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isChronic?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateMedicineDto extends PartialType(CreateMedicineDto) {}

const toBoolean = ({ value }: { value: unknown }) =>
  value === 'true' ? true : value === 'false' ? false : value;

export class MedicineListQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isChronic?: boolean;
}

export class MedicineDto {
  @ApiProperty() id: number;
  @ApiProperty() manufacturer: string;
  @ApiProperty() brandName: string;
  @ApiProperty() genericName: string;
  @ApiProperty({ nullable: true, type: String }) strength: string | null;
  @ApiProperty() dosage: string;
  @ApiProperty() dar: string;
  @ApiProperty() isChronic: boolean;
  @ApiProperty() isActive: boolean;
  @ApiProperty({ nullable: true, type: String }) sourceKey: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
}

export class ImportMedicinesDto {
  @ApiProperty({
    type: [CreateMedicineDto],
    maxItems: 5000,
    description:
      'Each item is validated individually; invalid items are reported in errors by index.',
  })
  @IsArray()
  @ArrayMaxSize(5000)
  items: unknown[];
}

export class ImportErrorDto {
  @ApiProperty() index: number;
  @ApiProperty() message: string;
}

export class ImportMedicinesResultDto {
  @ApiProperty() created: number;
  @ApiProperty() updated: number;
  @ApiProperty({
    description: 'Unchanged existing rows and in-batch duplicates (first wins)',
  })
  skipped: number;
  @ApiProperty({ type: [ImportErrorDto] }) errors: ImportErrorDto[];
}
