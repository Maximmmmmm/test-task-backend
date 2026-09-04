import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Shared application bootstrap configuration.
 *
 * Used by BOTH `main.ts` and the integration/e2e test suite so the tests
 * exercise the exact same HTTP stack (validation pipe, Swagger) as production.
 */
export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Backend Test Task API')
    .setDescription('Company staff hierarchy and salary calculation API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
}