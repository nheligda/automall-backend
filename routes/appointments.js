import express from 'express';
import * as db from '../models/database.js';

const router = express.Router();

// Create appointment
router.post('/', async (req, res) => {
  try {
    const { postId, buyerName, buyerEmail, buyerContact, apptDate } = req.body;

    if (!postId || !buyerName || !apptDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const appointment = await db.createAppointment(postId, buyerName, buyerEmail, buyerContact, apptDate);
    res.status(201).json({ message: 'Appointment created successfully', appointment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get appointments by post
router.get('/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const appointments = await db.getAppointmentsByPost(postId);
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all appointments
router.get('/', async (req, res) => {
  try {
    const appointments = await db.getAllAppointments();
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update appointment status
router.put('/:apptId/status', async (req, res) => {
  try {
    const { apptId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    const appointment = await db.updateAppointmentStatus(apptId, status);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json({ message: 'Appointment status updated', appointment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
