import express from 'express';
import * as db from '../models/database.js';

const router = express.Router();

// Get showroom status
router.get('/status', async (req, res) => {
  try {
    const showroom = await db.getShowroomStatus();
    res.json(showroom);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check if showroom has space
router.get('/check-space', async (req, res) => {
  try {
    const hasSpace = await db.hasShowroomSpace();
    res.json({ hasSpace });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Increase showroom count
router.post('/increase', async (req, res) => {
  try {
    await db.increaseShowroomCount();
    const showroom = await db.getShowroomStatus();
    res.json({ message: 'Showroom count increased', showroom });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Decrease showroom count
router.post('/decrease', async (req, res) => {
  try {
    await db.decreaseShowroomCount();
    const showroom = await db.getShowroomStatus();
    res.json({ message: 'Showroom count decreased', showroom });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
