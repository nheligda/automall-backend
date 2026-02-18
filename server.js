import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/database.js';
import initializeDatabase from './migrations/schema.js';
import syncLocalStorageToDatabase from './migrations/sync-data.js';

// Routes
import usersRouter from './routes/users.js';
import carsRouter from './routes/cars.js';
import inspectionsRouter from './routes/inspections.js';
import appointmentsRouter from './routes/appointments.js';
import transactionsRouter from './routes/transactions.js';
import swapsRouter from './routes/swaps.js';
import showroomRouter from './routes/showroom.js';

dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'AutoMall Backend is running' });
});

// Data Sync Endpoint - Import data from localStorage
app.post('/api/sync-data', async (req, res) => {
  try {
    const localData = req.body;
    console.log('📥 Sync request received:', {
      users: localData.users?.length || 0,
      cars: localData.carPosts?.length || 0,
      appointments: localData.appointments?.length || 0,
      inspections: localData.inspections?.length || 0,
      transactions: localData.transactions?.length || 0
    });
    
    await syncLocalStorageToDatabase(localData);
    
    console.log('✅ Sync completed successfully!');
    res.json({
      success: true,
      message: 'Data synchronized to database',
      synced: {
        users: localData.users?.length || 0,
        cars: localData.carPosts?.length || 0,
        appointments: localData.appointments?.length || 0,
        inspections: localData.inspections?.length || 0,
        transactions: localData.transactions?.length || 0
      }
    });
  } catch (error) {
    console.error('❌ Sync error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reset Database Endpoint - Clear all data
app.post('/api/reset-database', async (req, res) => {
  try {
    console.log('🔄 Resetting database...');
    const connection = await pool.getConnection();
    
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE Transactions');
    await connection.query('TRUNCATE TABLE Appointments');
    await connection.query('TRUNCATE TABLE Inspections');
    await connection.query('TRUNCATE TABLE Car_Posts');
    await connection.query('TRUNCATE TABLE Users');
    await connection.query('UPDATE Showroom SET CurrentCount = 0');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    
    connection.release();
    
    console.log('✅ Database reset complete');
    res.json({ success: true, message: 'Database reset successfully' });
  } catch (error) {
    console.error('❌ Reset error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// API Routes
app.use('/api/users', usersRouter);
app.use('/api/cars', carsRouter);
app.use('/api/inspections', inspectionsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/swaps', swapsRouter);
app.use('/api/showroom', showroomRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('🔄 Initializing database...');
    await initializeDatabase();
    console.log('✓ Database initialized successfully');

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n✓ AutoMall Backend Server running on http://localhost:${PORT}`);
      console.log(`✓ CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
      console.log(`✓ API Health Check: http://localhost:${PORT}/api/health`);
      console.log(`✓ Listening on all network interfaces (0.0.0.0)\n`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', err);
      }
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('❌ Uncaught Exception:', err);
      console.log('⚠️ Server continuing...');
    });

    process.on('unhandledRejection', (err) => {
      console.error('❌ Unhandled Rejection:', err);
      console.log('⚠️ Server continuing...');
    });

  } catch (error) {
    console.error('✗ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();

export default app;
