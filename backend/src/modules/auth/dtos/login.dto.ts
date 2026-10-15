import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Mobile number or email',
    example: '01700000000',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  identifier: string;

  @ApiProperty({ example: 'ChangeMe123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}
