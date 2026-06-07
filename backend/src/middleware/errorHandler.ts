import { Request, Response, NextFunction } from 'express';

export interface CustomError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error console warning in development
  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.error(`[Error] ${statusCode} - ${message}\nStack: ${err.stack}`);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
  });
};
