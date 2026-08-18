import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { SupabaseService } from './supabase.service';
import { Tenant } from './entities/tenant.entity';

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
        entities: [Tenant],
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
