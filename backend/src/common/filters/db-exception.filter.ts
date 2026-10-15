import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { QueryFailedError } from 'typeorm';

/** Turns common Postgres errors into proper HTTP errors instead of 500. */
@Catch(QueryFailedError)
export class DbExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DbExceptionFilter.name);

  catch(
    exception: QueryFailedError & { code?: string; detail?: string },
    host: ArgumentsHost,
  ) {
    const response = host.switchToHttp().getResponse<Response>();
    const map: Record<string, [number, string]> = {
      '23505': [
        HttpStatus.CONFLICT,
        'A record with the same unique value already exists',
      ],
      '23503': [
        HttpStatus.CONFLICT,
        'Referenced record does not exist or is still in use',
      ],
      '23514': [HttpStatus.BAD_REQUEST, 'A data rule was violated'],
      '23502': [HttpStatus.BAD_REQUEST, 'A required value is missing'],
      '22P02': [HttpStatus.BAD_REQUEST, 'Invalid value format'],
    };
    const hit = exception.code ? map[exception.code] : undefined;
    if (!hit) {
      this.logger.error(exception.message, exception.stack);
      return response
        .status(500)
        .json({ statusCode: 500, message: 'Internal server error' });
    }
    const [statusCode, message] = hit;
    return response
      .status(statusCode)
      .json({ statusCode, message, error: exception.code });
  }
}
