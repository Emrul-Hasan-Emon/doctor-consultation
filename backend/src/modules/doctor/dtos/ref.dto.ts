import { ApiProperty } from '@nestjs/swagger';

export class RefDto {
  @ApiProperty() id: number;
  @ApiProperty() name: string;
  @ApiProperty({ type: String, nullable: true }) nameBN: string | null;
}
