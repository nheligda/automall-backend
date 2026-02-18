import express from 'express';
import * as db from '../models/database.js';

const router = express.Router();

// Create swap request
router.post('/', async (req, res) => {
  try {
    const { targetPostId, buyerCarDetails, status } = req.body;

    if (!targetPostId || !buyerCarDetails) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const swapRequest = await db.createSwapRequest(targetPostId, buyerCarDetails, status || 'Pending');
    res.status(201).json({ message: 'Swap request created successfully', swapRequest });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get swap requests by target post
router.get('/post/:targetPostId', async (req, res) => {
  try {
    const { targetPostId } = req.params;
    const swapRequests = await db.getSwapRequestsByTargetPost(targetPostId);
    res.json(swapRequests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all swap requests
router.get('/', async (req, res) => {
  try {
    const swapRequests = await db.getAllSwapRequests();
    res.json(swapRequests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update swap request status
router.put('/:swapId/status', async (req, res) => {
  try {
    const { swapId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const swapRequest = await db.updateSwapRequestStatus(swapId, status);

    if (!swapRequest) {
      return res.status(404).json({ message: 'Swap request not found' });
    }

    res.json({ message: 'Swap request status updated', swapRequest });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
