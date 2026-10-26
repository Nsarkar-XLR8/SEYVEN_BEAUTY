import {
  BadRequestException,
  Injectable,
  ValidationError,
  ValidationPipe as NestValidationPipe,
} from '@nestjs/common';

@Injectable()
export class CustomValidationPipe extends NestValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        const formatErrors = (errors: ValidationError[]): Record<string, string[]> => {
          const result: Record<string, string[]> = {};
          errors.forEach((err) => {
            if (err.constraints) {
              result[err.property] = Object.values(err.constraints);
            }
            if (err.children && err.children.length > 0) {
              const childErrors = formatErrors(err.children);
              Object.keys(childErrors).forEach((childProp) => {
                result[`${err.property}.${childProp}`] = childErrors[childProp];
              });
            }
          });
          return result;
        };

        return new BadRequestException({
          message: 'Validation failed',
          errors: formatErrors(validationErrors),
        });
      },
    });
  }
}
