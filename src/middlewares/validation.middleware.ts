import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

/**
 * Creates a validation middleware for the specified request property using a Zod schema.
 * Validates body, query, or params.
 */
export function validate(schema: ZodSchema, property: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[property]);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));

      res.status(400).json({
        status: 'error',
        statusCode: 400,
        message: 'Validation failed',
        errors,
      });
      return;
    }

    // Replace the request property with the parsed (and transformed) data
    req[property] = result.data;
    next();
  };
}
