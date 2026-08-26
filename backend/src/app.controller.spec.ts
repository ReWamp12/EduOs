import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { SupabaseService } from './supabase.service';
import { RagService } from './rag/rag.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: SupabaseService,
          useValue: {
            isConfigured: () => false,
            getClient: () => null,
          },
        },
        {
          provide: RagService,
          useValue: {},
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('initialization', () => {
    it('should be defined', () => {
      expect(appController).toBeDefined();
    });
  });
});
