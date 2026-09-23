import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';

interface ErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

const PRISMA_STATUS_MAP: Record<string, HttpStatus> = {
  P2002: HttpStatus.CONFLICT, // unique constraint violation
  P2003: HttpStatus.CONFLICT, // FK constraint violation
  P2025: HttpStatus.NOT_FOUND, // record not found
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, error, message } = this.resolve(exception);

    const body: ErrorBody = {
      statusCode: status,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json(body);
  }

  private resolve(exception: unknown): {
    status: HttpStatus;
    error: string;
    message: string | string[];
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      if (typeof payload === 'string') {
        return { status, error: exception.name, message: payload };
      }
      const { error, message } = payload as {
        error?: string;
        message?: string | string[];
      };
      return {
        status,
        error: error ?? exception.name,
        message: message ?? exception.message,
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const status =
        PRISMA_STATUS_MAP[exception.code] ?? HttpStatus.BAD_REQUEST;
      return {
        status,
        error: 'DatabaseError',
        message: this.humanizePrismaError(exception),
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'InternalServerError',
      message: 'Ha ocurrido un error inesperado',
    };
  }

  private humanizePrismaError(
    exception: Prisma.PrismaClientKnownRequestError,
  ): string {
    switch (exception.code) {
      case 'P2002':
        return `Ya existe un registro con ese valor único (${(exception.meta?.target as string[] | undefined)?.join(', ')})`;
      case 'P2003':
        return 'La operación viola una relación existente';
      case 'P2025':
        return 'El registro solicitado no existe';
      default:
        return 'Error de base de datos';
    }
  }
}
