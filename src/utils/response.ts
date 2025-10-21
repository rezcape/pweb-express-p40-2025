import { Response } from 'express';

export const sendSuccess = (res: Response, data: any, message: string = 'Success', statusCode: number = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

export const sendError = (res: Response, message: string, statusCode: number = 500, errors?: any) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors })
  });
};