import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

jest.setTimeout(30000);

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  it('/api/student/overview/:id (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/api/student/overview/s-101');
    expect(res.status).toBeLessThan(500);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
