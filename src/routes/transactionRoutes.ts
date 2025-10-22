import { Router } from 'express';
import {
    createTransaction,
    getAllTransactions,
    getTransactionById
}
from '../controllers/transactionController';

const router = Router();

router.post('/', createTransaction);
router.get('/', getAllTransactions);
router.get('/:id', getTransactionById);

export default router;
