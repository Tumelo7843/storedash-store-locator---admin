import type { ErrorRequestHandler, RequestHandler } from 'express';
import { MulterError } from 'multer';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { message: err.message, code: err.code, ...(err.details ? { details: err.details } : {}) },
    });
    return;
  }

  if (err instanceof MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be smaller than 5MB' : err.message;
    res.status(400).json({ error: { message, code: 'BAD_REQUEST' } });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: { message: 'Invalid request data', code: 'VALIDATION_ERROR', details: err.flatten() },
    });
    return;
  }

  // express.json() throws a SyntaxError (via body-parser) for malformed
  // request bodies — that's a client mistake, not a server failure.
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: { message: 'Malformed JSON in request body', code: 'BAD_REQUEST' } });
    return;
  }

  console.error(`Unhandled error on ${req.method} ${req.path}:`, err);
  res.status(500).json({ error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } });
};

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: { message: `No route for ${req.method} ${req.path}`, code: 'NOT_FOUND' } });
};
