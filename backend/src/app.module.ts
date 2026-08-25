import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { SupabaseService } from './supabase.service';
import { RagService } from './rag/rag.service';

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
import { AuthModule } from './auth/auth.module';
import { CommonServicesModule } from './common/common.module';
import { FinanceModule } from './finance/finance.module';

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
        // Same DB_* names the seed/RAG scripts and .env use — the old
        // SUPABASE_DB_* names resolved to undefined, so pg silently dialed
        // localhost:5432 and crashed the boot with SSL retry errors.
        host: config.get<string>('DB_HOST'),
        port: parseInt(config.get<string>('DB_PORT', '5432'), 10),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME', 'postgres'),
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
        // EDUOS-106: synchronize DISABLED. Against the live Supabase schema
        // (created by SQL migrations), TypeORM diffing tried destructive
        // column rebuilds at every boot (e.g. drop/re-add job_openings.title,
        // employee_records.employee_code) and crashed the server. Schema
        // changes belong in supabase/migrations/*.sql.
        synchronize: false,
        ssl: {
          rejectUnauthorized: false, // Required for Supabase SSL connections
        },
      }),
    }),
    DnsSslModule,
    HrModule,
    AuthModule,
    CommonServicesModule,
    FinanceModule,
  ],
  controllers: [AppController],
  providers: [RagService],
})
export class AppModule {}
