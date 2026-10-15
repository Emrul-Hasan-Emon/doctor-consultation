import { Controller } from '@nestjs/common';
import { PatientChamberService } from '../services/patient-chamber.service';

@Controller('api/patient/chamber')
export class PatientChamberController {
  constructor(private readonly service: PatientChamberService) {}
}
