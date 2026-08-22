import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HrController } from './hr.controller';
import { HrService } from './hr.service';
import { SupabaseService } from '../supabase.service';

import { JobOpening } from '../entities/job-opening.entity';
import { Applicant } from '../entities/applicant.entity';
import { InterviewScorecard } from '../entities/interview-scorecard.entity';
import { EmployeeRecord } from '../entities/employee.entity';
import { EmployeeServiceRecord } from '../entities/employee-service-record.entity';
import { TrainingRecord } from '../entities/training-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      JobOpening,
      Applicant,
      InterviewScorecard,
      EmployeeRecord,
      EmployeeServiceRecord,
      TrainingRecord,
    ]),
  ],
  controllers: [HrController],
  providers: [HrService, SupabaseService],
  exports: [HrService],
})
export class HrModule {}
