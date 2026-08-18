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
        ],
        synchronize: true, // Auto-scaffold new tables / columns in dev mode
        ssl: {
          rejectUnauthorized: false, // Required for Supabase SSL connections
        },
      }),
    }),
  ],
  controllers: [AppController],
  providers: [SupabaseService],
})
export class AppModule {}
