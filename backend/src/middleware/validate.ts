import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';

// Validates req.body against a shared Zod schema and replaces it with the parsed value.
// Failures go to the error handler as a ZodError. The same for the query string. The parsed value goes in res.locals
// where the controller reads it as `query(res)`.
export function validateQuery(schema: ZodTypeAny): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) return next(result.error);
    res.locals.query = result.data;
    next();
  };
}

export function validateBody(schema: ZodTypeAny): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) return next(result.error);
    req.body = result.data;
    next();
  };
}
