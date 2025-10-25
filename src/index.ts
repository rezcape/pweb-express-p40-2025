import express, { Request, Response, Application } from "express"; // Import Request, Response, Application
import dotenv from "dotenv";
import cors from "cors"; // <-- 1. IMPORT CORS
import authRoutes from "./router/auth.routes";
import genreRoutes from "./router/genre.routes";
import bookRoutes from "./router/book.routes";
import transactionRoutes from "./router/transaction.routes";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 8080; // <-- Ganti ke 8080 agar sama dengan Postman

// Middleware
app.use(cors()); // <-- 2. GUNAKAN CORS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/auth", authRoutes);
app.use("/genre", genreRoutes);
app.use("/books", bookRoutes);
app.use("/transactions", transactionRoutes);

// Health check (Sesuai Postman)
// <-- 3. PINDAHKAN KE /health-check
app.get("/health-check", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "IT Literature Shop API is running",
    date: new Date().toUTCString(), // Tambahkan tanggal sesuai Postman
  });
});

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
