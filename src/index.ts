import express from "express";
import dotenv from "dotenv";
import authRoutes from "./router/auth.routes";
import genreRoutes from "./router/genre.routes";
import bookRoutes from "./router/book.routes";
import transactionRoutes from "./router/transaction.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/auth", authRoutes);
app.use("/genre", genreRoutes);
app.use("/books", bookRoutes);
app.use("/transactions", transactionRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "IT Literature Shop API is running",
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
