import { Router } from "express";
import {
  createTransaction,
  getAllTransactions,
  getTransactionDetail,
  getTransactionStatistics,
} from "../controllers/transaction.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", authMiddleware, createTransaction);
router.get("/", getAllTransactions);
router.get("/statistics", getTransactionStatistics);
router.get("/:transaction_id", getTransactionDetail);

export default router;
