import type { NextFunction, Request, RequestHandler, Response } from 'express';

// Wraps an async route handler so rejected promises reach the error-handling
// middleware instead of crashing the process or hanging the request.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
