import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { SupabaseService } from './supabase.service';

// Entities
import { Tenant } from './entities/tenant.entity';
import { Subject } from './entities/subject.entity';
import { Attendance } from './entities/attendance.entity';
import { Assignment } from './entities/assignment.entity';
import { AssignmentSubmission } from './entities/submission.entity';
import { Exam } from './entities/exam.entity';
import { ExamResult } from './entities/exam-result.entity';
import { Notice } from './entities/notice.entity';
import { LeaveRequest } from './entities/leave-request.entity';
import { CustomDomain } from './entities/custom-domain.entity';
import { JobOpening } from './entities/job-opening.entity';
import { Applicant } from './entities/applicant.entity';
import { InterviewScorecard } from './entities/interview-scorecard.entity';
import { EmployeeRecord } from './entities/employee.entity';
import { EmployeeServiceRecord } from './entities/employee-service-record.entity';
import { TrainingRecord } from './entities/training-record.entity';
import { DnsSslModule } from './dns-ssl/dns-ssl.module';
import { HrModule } from './hr/hr.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [
          Tenant,
          Subject,
          Attendance,
          Assignment,
          AssignmentSubmission,
          Exam,
          ExamResult,
          Notice,
          LeaveRequest,
          CustomDomain,
          JobOpening,
          Applicant,
          InterviewScorecard,
          EmployeeRecord,
          EmployeeServiceRecord,
          TrainingRecord,
        ],
        synchronize: true, // Auto-scaffold new tables / columns in dev mode
        ssl: {
          rejectUnauthorized: false, // Required for Supabase SSL connections
        },
      }),
    }),
    DnsSslModule,
    HrModule,
  ],
  controllers: [AppController],
  providers: [SupabaseService],
})
export class AppModule {}
