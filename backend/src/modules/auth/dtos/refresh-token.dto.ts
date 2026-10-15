import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @MaxLength(512)
  refreshToken: string;
}
