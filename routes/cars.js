import express from 'express';
import * as db from '../models/database.js';

const router = express.Router();

// Create a car post
router.post('/', async (req, res) => {
  try {
    const { sellerId, sellerName, make, model, year, photos, expectedPrice, color, mileage, condition, description } = req.body;

    if (!sellerId || !make || !model) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const carPost = await db.createCarPost(sellerId, sellerName, make, model, year, photos || [], expectedPrice, color, mileage, condition, description);
    res.status(201).json({ message: 'Car post created successfully', carPost });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get car post by ID
router.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const carPost = await db.getCarPostById(postId);

    if (!carPost) {
      return res.status(404).json({ message: 'Car post not found' });
    }

    res.json(carPost);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get car posts by seller
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;
    const carPosts = await db.getCarPostsBySeller(sellerId);
    res.json(carPosts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get draft car posts (for staff verification)
router.get('/status/draft', async (req, res) => {
  try {
    const draftPosts = await db.getDraftCarPosts();
    res.json(draftPosts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get verified car posts (for public catalog)
router.get('/status/verified', async (req, res) => {
  try {
    const verifiedPosts = await db.getVerifiedCarPosts();
    res.json(verifiedPosts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update car post status
router.put('/:postId/status', async (req, res) => {
  try {
    const { postId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    // If verifying, check showroom space
    if (status === 'Verified') {
      const hasSpace = await db.hasShowroomSpace();
      if (!hasSpace) {
        return res.status(409).json({ message: 'Showroom is at maximum capacity' });
      }
      await db.increaseShowroomCount();
    }

    const updatedPost = await db.updateCarPostStatus(postId, status);

    if (!updatedPost) {
      return res.status(404).json({ message: 'Car post not found' });
    }

    res.json({ message: 'Car post status updated', carPost: updatedPost });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete car post (only draft posts)
router.delete('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const carPost = await db.getCarPostById(postId);

    if (!carPost) {
      return res.status(404).json({ message: 'Car post not found' });
    }

    if (carPost.Status !== 'Draft') {
      return res.status(409).json({ message: 'Only draft posts can be deleted' });
    }

    await db.deleteCarPost(postId);
    res.json({ message: 'Car post deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
