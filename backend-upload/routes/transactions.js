import express from 'express';
import * as db from '../models/database.js';

const router = express.Router();

// Record a sale (create transaction)
router.post('/', async (req, res) => {
  try {
    const { postId, buyerId, buyerName, buyerEmail, buyerPhone, finalSalePrice } = req.body;

    if (!postId || !buyerName || !finalSalePrice) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Mark car as sold
    await db.updateCarPostStatus(postId, 'Sold');

    // Decrease showroom count
    await db.decreaseShowroomCount();

    // Create transaction
    const transaction = await db.createTransaction(postId, buyerId, buyerName, buyerEmail, buyerPhone, finalSalePrice);

    res.status(201).json({ message: 'Sale recorded successfully', transaction });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get transaction by post
router.get('/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const transaction = await db.getTransactionByPost(postId);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const transactions = await db.getAllTransactions();
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
