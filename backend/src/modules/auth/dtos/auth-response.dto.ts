import { ApiProperty } from '@nestjs/swagger';
import { UserType } from '../../../database/enums';

export class AuthUserDto {
  @ApiProperty() accountId: number;
  @ApiProperty({ enum: UserType }) type: UserType;
  @ApiProperty() profileId: number;
  @ApiProperty() name: string;
  @ApiProperty() mobile: string;
  @ApiProperty({ nullable: true, type: String }) email: string | null;
  @ApiProperty({ nullable: true, type: Number }) doctorId: number | null;
}

export class AuthResponseDto {
  @ApiProperty() accessToken: string;
  @ApiProperty() refreshToken: string;
  @ApiProperty({ description: 'Access token lifetime in seconds' })
  expiresIn: number;
  @ApiProperty({ type: AuthUserDto }) user: AuthUserDto;
}
