import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

export interface ErrorResponseBody {
  statusCode: number;
  message: string | string[];
  path: string;
  timestamp: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isProduction = process.env.NODE_ENV === 'production';

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const rawMessage = (exceptionResponse as { message?: unknown }).message;
        if (Array.isArray(rawMessage)) {
          message = rawMessage.map(String);
        } else if (typeof rawMessage === 'string') {
          message = rawMessage;
        } else {
          message = exception.message || 'Internal server error';
        }
      } else if (!isProduction && exception instanceof Error) {
        //En développement uniquement, on peut exposer le message d'erreur brut de l'exception
        message = exception.message;
      }

      // Journalisation de l'erreur pour le suivi et le débogage côté serveur
      if (exception instanceof Error) {
        this.logger.error(
          `${request.method} ${request.url} -> ${statusCode}: ${exception.message}`,
          exception.stack,
        );
      } else {
        this.logger.error(
          `${request.method} ${request.url} -> ${statusCode}: ${String(exception)}`,
        );
      }

      const errorBody: ErrorResponseBody = {
        statusCode,
        message,
        path: request.url,
        timestamp: new Date().toISOString(),
      };

      response.status(statusCode).json(errorBody);
    }
  }
}
