import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { CORRELATION_ID_HEADER } from '../constants';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const correlationId = (req.headers[CORRELATION_ID_HEADER] as string) || uuidv4();
    req.headers[CORRELATION_ID_HEADER] = correlationId;
    res.setHeader(CORRELATION_ID_HEADER, correlationId);

    const startTime = Date.now();
    const method = req.method;
    const url = req.originalUrl || req.url;
    const ip = req.ip || req.socket.remoteAddress;

    return next.handle().pipe(
      tap({
        next: () => {
          const latencyMs = Date.now() - startTime;
          const statusCode = res.statusCode;
          this.logger.log(
            JSON.stringify({
              correlationId,
              method,
              url,
              statusCode,
              latencyMs,
              ip,
              timestamp: new Date().toISOString(),
            }),
          );
        },
        error: (err: unknown) => {
          const latencyMs = Date.now() - startTime;
          const status = (err as { status?: number })?.status || 500;
          this.logger.error(
            JSON.stringify({
              correlationId,
              method,
              url,
              statusCode: status,
              latencyMs,
              ip,
              error: (err as { message?: string })?.message || 'Internal Server Error',
              timestamp: new Date().toISOString(),
            }),
          );
        },
      }),
    );
  }
}
