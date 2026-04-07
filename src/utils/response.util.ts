import type { Response } from 'express';
import type { ApiResponse, PaginationMeta } from '../types/api.types';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  const response: ApiResponse<T> = {
    status: 'success',
    data,
  };
  res.status(statusCode).json(response);
}

export function sendPaginated<T>(
  res: Response,
  items: T[],
  pagination: PaginationMeta,
  statusCode = 200
): void {
  res.status(statusCode).json({
    status: 'success',
    data: {
      courses: items,
      pagination,
    },
  });
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  errors?: Array<{ field: string; message: string }>
): void {
  const response: ApiResponse = {
    status: 'error',
    statusCode,
    message,
    errors,
  };
  res.status(statusCode).json(response);
}
