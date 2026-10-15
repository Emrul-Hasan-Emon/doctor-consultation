import { ApiProperty } from '@nestjs/swagger';

export class ChamberRefDto {
  @ApiProperty() id: number;
  @ApiProperty() name: string;
  @ApiProperty({ type: String, nullable: true }) nameBN: string | null;
}
