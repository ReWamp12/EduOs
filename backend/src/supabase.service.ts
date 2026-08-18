import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private client: SupabaseClient | null = null;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const url = this.configService.get<string>('SUPABASE_URL');
    const key = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (url && key && url !== 'https://placeholder-eduos.supabase.co' && key !== 'placeholder-anon-key') {
      this.client = createClient(url, key);
      this.logger.log('Supabase RLS isolated database client initialized successfully.');
    } else {
      this.logger.warn(
        'Supabase keys are missing or set to placeholders. Backend API will run in sandbox/mock fallback mode.',
      );
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  getClient(): SupabaseClient {
    if (!this.client) {
      throw new Error('Supabase client is not configured.');
    }
    return this.client;
  }
}
