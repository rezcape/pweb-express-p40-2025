import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      return sendError(res, 'Data already exists', 409);
    }
    if (err.code === 'P2025') {
      return sendError(res, 'Data not found', 404);
    }
  }

  return sendError(res, err.message || 'Internal server error', err.statusCode || 500);
};