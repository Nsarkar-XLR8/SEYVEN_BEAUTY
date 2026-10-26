import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CORRELATION_ID_HEADER } from '../constants';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId = (request.headers[CORRELATION_ID_HEADER] as string) || 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';
    let errorName = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as Record<string, unknown>).message || exceptionResponse;
        errorName = ((exceptionResponse as Record<string, unknown>).error as string) || exception.name;
      } else {
        message = exceptionResponse;
        errorName = exception.name;
      }
    } else if (exception instanceof Error) {
      if (exception.name === 'PrismaClientInitializationError' || exception.message.includes("Can't reach database server")) {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        message = 'Database service is currently unreachable. Please ensure the PostgreSQL server is running.';
        errorName = 'DatabaseConnectionError';
      } else {
        message = exception.message;
        errorName = exception.name;
      }
    } else if (typeof exception === 'string') {
      message = exception;
    }

    const errorPayload = {
      statusCode: status,
      error: errorName,
      message,
      path: request.url,
      method: request.method,
      correlationId,
      timestamp: new Date().toISOString(),
    };

    if (status >= 500) {
      this.logger.error(
        `[${correlationId}] Internal Server Error: ${JSON.stringify(errorPayload)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`[${correlationId}] Client Error: ${JSON.stringify(errorPayload)}`);
    }

    response.status(status).json(errorPayload);
  }
}
