import type { Request, Response, NextFunction } from 'express';

/**
 * Wraps an async route handler to catch errors and forward them to Express error middleware.
 */
export function catchAsync(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
