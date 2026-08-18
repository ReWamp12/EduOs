import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set the global prefix for all API routes to /api
  app.setGlobalPrefix('api');

  // Enable Cross-Origin Resource Sharing (CORS) so frontend on 3000 can request backend on 4000
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`NestJS Backend API Server is active and listening on: http://localhost:${port}/api`);
}
bootstrap();
