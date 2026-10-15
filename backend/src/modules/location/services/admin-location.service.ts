import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { DistrictRefDto, RefDto } from '../dtos/location.dto';

@Injectable()
export class AdminLocationService {
  constructor(private readonly db: DatabaseService) {}

  divisions(): Promise<RefDto[]> {
    return this.db.divisionRepository.find({
      select: { id: true, name: true, nameBN: true },
      order: { name: 'ASC' },
    });
  }

  districts(divisionId?: number): Promise<DistrictRefDto[]> {
    return this.db.districtRepository.find({
      select: { id: true, name: true, nameBN: true, divisionId: true },
      where: divisionId ? { divisionId } : {},
      order: { name: 'ASC' },
    });
  }
}
