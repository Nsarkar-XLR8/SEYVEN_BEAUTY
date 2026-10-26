import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { CustomValidationPipe } from './common/pipes/validation.pipe';

// Initialize Sentry Observability & Logging
const sentryDsn =
  process.env.SENTRY_DSN ||
  'https://cc0feac5a15669bf562b27bae1830872@o4512275691929600.ingest.de.sentry.io/4512275710083152';

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    _experiments: {
      enableLogs: true,
    },
  });

  const { logger: sentryLogger } = Sentry as any;
  if (sentryLogger && typeof sentryLogger.info === 'function') {
    sentryLogger.info('Hello from Sentry Logs — SEYVEN Engine Live');
  }
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    bufferLogs: false,
  });

  // Body parser limit configuration to support direct Cloudinary image uploads
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  const corsOrigin = configService.get<string>('CORS_ORIGIN', '*');

  // Security Headers with CSP accommodating Scalar CDN assets
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`, 'https://cdn.jsdelivr.net', 'https://fonts.googleapis.com'],
          fontSrc: [`'self'`, 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net'],
          imgSrc: [`'self'`, 'data:', 'https:'],
          scriptSrc: [`'self'`, `https:`, `'unsafe-inline'`, `'unsafe-eval'`],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // CORS Configuration
  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(',').map((o: string) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id', 'x-idempotency-key'],
  });

  // Global Prefix for API endpoints (excluding health checks, root docs, and SEO sitemap)
  app.setGlobalPrefix(apiPrefix, {
    exclude: ['health/live', 'health/ready', 'docs', 'reference', 'openapi.json', 'sitemap.xml'],
  });

  // Global Interceptors, Filters & Pipes
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(new CustomValidationPipe());

  // OpenAPI Specification Configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SEYVEN API Documentation')
    .setDescription(
      'Advanced High-Performance Dermal E-Commerce Engine — Interactive API Reference & OpenAPI 3.0 Specification',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT Access Token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Health', 'System health and Kubernetes liveness/readiness probes')
    .addTag('Auth', 'Authentication, OTP verification, session & JWT lifecycle')
    .addTag('Catalog', 'Product catalogue, hierarchy, variants, and draft preview')
    .addTag('Inventory', 'FEFO lot batching, stock adjustments, and safety recalls')
    .addTag('Search', 'High-performance database search and typeahead autocomplete')
    .addTag('Promotions', 'Seasonal festival courtesy campaigns')
    .addTag('RMA', 'Hygienic returns & refund disbursements')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // Raw OpenAPI JSON endpoint
  app.use('/openapi.json', (_req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(document);
  });

  // Scalar Interactive API Reference
  app.use(
    '/docs',
    apiReference({
      spec: {
        content: document,
      },
      theme: 'purple',
      layout: 'modern',
      darkMode: true,
      metaData: {
        title: 'SEYVEN API Reference',
        description: 'Interactive API Reference for SEYVEN Dermal E-Commerce Engine',
      },
    }),
  );

  app.use(
    '/reference',
    apiReference({
      spec: {
        content: document,
      },
      theme: 'purple',
      layout: 'modern',
      darkMode: true,
    }),
  );

  await app.listen(port);
  logger.log(`🚀 SEYVEN Backend Engine is running on http://localhost:${port}/${apiPrefix}`);
  logger.log(`📖 Scalar API Reference is available at http://localhost:${port}/docs (or /reference)`);
  logger.log(`📄 Raw OpenAPI schema at http://localhost:${port}/openapi.json`);
  logger.log(`🩺 Health check endpoints live at http://localhost:${port}/health/live & /health/ready`);
}

bootstrap();

