import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

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

  // OpenAPI Swagger Specification (Part 6 §6.4 & Part 7 §7.4)
  const config = new DocumentBuilder()
    .setTitle('EduOS Platform API')
    .setDescription('Multi-Tenant Indian Education Operating System Backend API with RBAC and Supabase Integration')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'jwt-auth')
    .addApiKey({ type: 'apiKey', in: 'header', name: 'x-tenant-id' }, 'tenant-header')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'EduOS API Documentation',
  });

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`NestJS Backend API Server is active and listening on: http://localhost:${port}/api`);
  console.log(`OpenAPI Swagger documentation available at: http://localhost:${port}/api/docs`);
}
bootstrap();
