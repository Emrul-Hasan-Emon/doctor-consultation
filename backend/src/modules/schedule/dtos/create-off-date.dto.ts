import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateOffDateDto {
  @ApiProperty({ example: '2026-10-20', description: 'Today or later' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reasonBN?: string;

  @ApiPropertyOptional({
    description: 'Cancel SCHEDULED appointments of that day instead of failing',
  })
  @IsOptional()
  @IsBoolean()
  cancelAppointments?: boolean;
}
