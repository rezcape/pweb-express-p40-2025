import { Request, Response } from "express";

export const getAllBooks = (req: Request, res: Response) => {
  res.json([
    { id: 1, title: "Atomic Habits", author: "James Clear" },
    { id: 2, title: "Deep Work", author: "Cal Newport" },
    { id: 3, title: "Rich Dad Poor Dad", author: "Robert Kiyosaki" },
  ]);
};

export const getBookById = (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({ id, title: "Example Book", author: "Sample Author" });
};

export const addBook = (req: Request, res: Response) => {
  const { title, author } = req.body;
  res.json({ message: "Book added successfully", title, author });
};