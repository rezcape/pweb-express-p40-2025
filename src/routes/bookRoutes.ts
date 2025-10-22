// routes/bookRoutes.ts
import { Router } from 'express';
import * as bookController from '../controllers/bookController';
// If you want to protect routes, use the `authenticate` middleware from ../middlewares/authMiddleware
// import { authenticate } from '../middlewares/authMiddleware';

const router = Router();

// Public endpoints
router.get('/', bookController.getAllBooks);          // GET /books
router.get('/:id', bookController.getBookById);      // GET /books/:id

// Create book (unprotected for now)
router.post('/', bookController.addBook);             // POST /books

export default router;