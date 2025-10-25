import { Router } from "express";
import {
  createBook,
  getAllBooks,
  getBookById,
  getBooksByGenre,
  updateBook,
  deleteBook,
} from "../controllers/book.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// Semua rute buku diproteksi oleh satpam (middleware)
router.use(authMiddleware);

router.post("/", createBook);
router.get("/", getAllBooks);

// PERBAIKAN DI SINI:
// Rute spesifik '/genre' harus ada SEBELUM rute dinamis '/:id'
router.get("/genre/:genreId", getBooksByGenre); // Ganti ke :genreId

// PERBAIKAN DI SINI:
router.get("/:id", getBookById); // Ganti ke :id
router.patch("/:id", updateBook); // Ganti ke :id
router.delete("/:id", deleteBook); // Ganti ke :id

export default router;
