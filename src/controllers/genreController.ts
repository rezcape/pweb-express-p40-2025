import { Request, Response } from 'express';

export const getAllGenres = (req: Request, res: Response) => {
  res.json([
    { id: 1, name: 'Fiction' },
    { id: 2, name: 'Non-fiction' },
    { id: 3, name: 'Self-help' },
  ]);
};

export const getGenreById = (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({ id, name: 'Example Genre' });
};

export const addGenre = (req: Request, res: Response) => {
  const { name } = req.body;
  res.status(201).json({ message: 'Genre added', name });
};

export const updateGenre = (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  res.json({ message: 'Genre updated', id, name });
};

export const deleteGenre = (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({ message: 'Genre deleted', id });
};
