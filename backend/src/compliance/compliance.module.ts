import { Module } from '@nestjs/common';
import { ComplianceController } from './compliance.controller';
import { SupabaseService } from '../supabase.service';

@Module({
  controllers: [ComplianceController],
  providers: [SupabaseService],
  exports: [],
})
export class ComplianceModule {}
