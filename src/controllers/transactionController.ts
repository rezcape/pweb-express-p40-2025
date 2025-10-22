import { Request, Response } from 'express';

export const createTransaction = (req: Request, res: Response) => {
  const { items, total } = req.body;
  // Return a fake transaction object
  res.status(201).json({ id: 1, items: items || [], total: total || 0, message: 'Transaction created' });
};

export const getAllTransactions = (req: Request, res: Response) => {
  res.json([
    { id: 1, userId: 'user1', total: 100 },
    { id: 2, userId: 'user2', total: 50 },
  ]);
};

export const getTransactionById = (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({ id, userId: 'user1', total: 100 });
};
