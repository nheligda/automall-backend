import express from 'express';
import * as db from '../models/database.js';

const router = express.Router();

// Create inspection
router.post('/', async (req, res) => {
  try {
    const { postId, staffId, staffName, finalPrice, conditionNotes } = req.body;

    if (!postId || !staffId || finalPrice === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const inspection = await db.createInspection(postId, staffId, staffName, finalPrice, conditionNotes);
    res.status(201).json({ message: 'Inspection created successfully', inspection });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get inspection by post
router.get('/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const inspection = await db.getInspectionByPost(postId);

    if (!inspection) {
      return res.status(404).json({ message: 'Inspection not found' });
    }

    res.json(inspection);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get inspections by staff
router.get('/staff/:staffId', async (req, res) => {
  try {
    const { staffId } = req.params;
    const inspections = await db.getInspectionsByStaff(staffId);
    res.json(inspections);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update inspection
router.put('/:inspectionId', async (req, res) => {
  try {
    const { inspectionId } = req.params;
    const { finalPrice, conditionNotes } = req.body;

    if (finalPrice === undefined) {
      return res.status(400).json({ message: 'Final price is required' });
    }

    const inspection = await db.updateInspection(inspectionId, finalPrice, conditionNotes);

    if (!inspection) {
      return res.status(404).json({ message: 'Inspection not found' });
    }

    res.json({ message: 'Inspection updated successfully', inspection });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
