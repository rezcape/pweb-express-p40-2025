import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middlewares/errorHandler';

// Import routes (akan dibuat nanti)
import authRoutes from './routes/authRoutes';
import bookRoutes from './routes/bookRoutes';
import genreRoutesImport from './routes/genreRoutes';
import transactionRoutesImport from './routes/transactionRoutes';

const genreRoutes = (genreRoutesImport as any).default || genreRoutesImport;
const transactionRoutes = (transactionRoutesImport as any).default || transactionRoutesImport;

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'IT Literature Shop API' });
});

app.use('/auth', authRoutes);
app.use('/books', bookRoutes);
app.use('/genre', genreRoutes);
app.use('/transactions', transactionRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 IT Literature Shop API`);
});

export default app;