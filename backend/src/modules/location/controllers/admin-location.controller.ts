import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserType } from '../../../database/enums';
import { DistrictQueryDto, DistrictRefDto, RefDto } from '../dtos/location.dto';
import { AdminLocationService } from '../services/admin-location.service';

@ApiTags('Admin / Location')
@ApiBearerAuth()
@Roles(UserType.ADMIN)
@Controller('api/admin/location')
export class AdminLocationController {
  constructor(private readonly service: AdminLocationService) {}

  @Get('divisions')
  @ApiOperation({ summary: 'List divisions' })
  @ApiOkResponse({ type: [RefDto] })
  divisions() {
    return this.service.divisions();
  }

  @Get('districts')
  @ApiOperation({ summary: 'List districts, optionally of one division' })
  @ApiOkResponse({ type: [DistrictRefDto] })
  districts(@Query() query: DistrictQueryDto) {
    return this.service.districts(query.divisionId);
  }
}
