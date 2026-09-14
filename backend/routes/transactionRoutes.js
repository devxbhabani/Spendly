import express from 'express';
import {
  getTransactions,
  createTransaction,
  batchCreateTransactions,
  deleteTransaction,
  clearAllTransactions,
  getAnalytics,
} from '../controllers/transactionController.js';

const router = express.Router();

// Routes
router.route('/transactions')
  .get(getTransactions)
  .post(createTransaction)
  .delete(clearAllTransactions);

router.post('/transactions/batch', batchCreateTransactions);
router.delete('/transactions/:id', deleteTransaction);
router.get('/analytics', getAnalytics);

export default router;
