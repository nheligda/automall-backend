import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || process.env.SERVER_PORT || 5000;

// ==================== DATABASE POOL ====================
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'automall',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ==================== MIDDLEWARE ====================
app.use(cors({ 
  origin: [
    'http://localhost:5173',
    'http://localhost',
    'http://localhost:80',
    'https://transcendent-taffy-0ae9a8.netlify.app',
    /\.netlify\.app$/  // Allow all Netlify domains
  ],
  credentials: true 
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ==================== SIMPLE HELPER ====================
async function getConnection() {
  return await pool.getConnection();
}

// ==================== AUTH ENDPOINTS ====================

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const conn = await getConnection();
    
    const [rows] = await conn.query('SELECT * FROM Users WHERE Email = ?', [email]);
    conn.release();
    
    if (!rows[0]) return res.status(401).json({ message: 'Invalid email or password' });
    
    const validPassword = await bcrypt.compare(password, rows[0].Password);
    if (!validPassword) return res.status(401).json({ message: 'Invalid email or password' });
    
    const user = { ...rows[0] };
    delete user.Password;
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const conn = await getConnection();
    
    const [existing] = await conn.query('SELECT UserID FROM Users WHERE Email = ?', [email]);
    if (existing[0]) {
      conn.release();
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await conn.query(
      'INSERT INTO Users (Name, Email, Password, Role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );
    conn.release();
    
    res.json({ success: true, message: 'User created', userId: result.insertId });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== CAR ENDPOINTS ====================

// Get all in-showroom cars
app.get('/api/cars/showroom', async (req, res) => {
  try {
    const conn = await getConnection();
    const [cars] = await conn.query(
      "SELECT * FROM Car_Posts WHERE Status = 'Verified' ORDER BY CreatedAt DESC"
    );
    conn.release();
    
    const parsed = cars.map(car => ({
      ...car,
      Photos: car.Photos ? JSON.parse(car.Photos) : []
    }));
    
    res.json({ success: true, cars: parsed });
  } catch (error) {
    console.error('Get cars error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get draft cars (for seller or staff)
app.get('/api/cars/draft/:sellerId', async (req, res) => {
  try {
    const conn = await getConnection();
    const [cars] = await conn.query(
      "SELECT * FROM Car_Posts WHERE SellerID = ? AND Status = 'Draft'",
      [req.params.sellerId]
    );
    conn.release();
    
    const parsed = cars.map(car => ({
      ...car,
      Photos: car.Photos ? JSON.parse(car.Photos) : []
    }));
    
    res.json({ success: true, cars: parsed });
  } catch (error) {
    console.error('Get draft cars error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create car post (seller)
app.post('/api/cars', async (req, res) => {
  try {
    const { sellerId, sellerName, make, model, year, color, mileage, condition, expectedPrice, description, photos } = req.body;
    const conn = await getConnection();
    
    const photosJson = JSON.stringify(photos || []);
    const [result] = await conn.query(
      `INSERT INTO Car_Posts (SellerID, SellerName, Make, Model, Year, Color, Mileage, \`Condition\`, ExpectedPrice, Description, Photos, Status, CreatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', NOW())`,
      [sellerId, sellerName, make, model, year, color, mileage, condition, expectedPrice, description, photosJson]
    );
    conn.release();
    
    res.json({ success: true, message: 'Car post created', postId: result.insertId });
  } catch (error) {
    console.error('Create car error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update car post
app.put('/api/cars/:postId', async (req, res) => {
  try {
    const { make, model, year, color, mileage, condition, expectedPrice, description, photos } = req.body;
    const conn = await getConnection();
    
    const photosJson = JSON.stringify(photos || []);
    await conn.query(
      `UPDATE Car_Posts SET Make=?, Model=?, Year=?, Color=?, Mileage=?, \`Condition\`=?, ExpectedPrice=?, Description=?, Photos=? WHERE PostID=?`,
      [make, model, year, color, mileage, condition, expectedPrice, description, photosJson, req.params.postId]
    );
    conn.release();
    
    res.json({ success: true, message: 'Car post updated' });
  } catch (error) {
    console.error('Update car error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Delete car post (only draft)
app.delete('/api/cars/:postId', async (req, res) => {
  try {
    const conn = await getConnection();
    await conn.query('DELETE FROM Car_Posts WHERE PostID = ? AND Status = "Draft"', [req.params.postId]);
    conn.release();
    
    res.json({ success: true, message: 'Car post deleted' });
  } catch (error) {
    console.error('Delete car error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== INSPECTION ENDPOINTS ====================

// Get draft cars for staff approval
app.get('/api/inspections/pending', async (req, res) => {
  try {
    const conn = await getConnection();
    const [cars] = await conn.query(
      "SELECT * FROM Car_Posts WHERE Status = 'Draft' ORDER BY CreatedAt ASC"
    );
    conn.release();
    
    const parsed = cars.map(car => ({
      ...car,
      Photos: car.Photos ? JSON.parse(car.Photos) : []
    }));
    
    res.json({ success: true, cars: parsed });
  } catch (error) {
    console.error('Get pending cars error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Approve car (staff)
app.post('/api/inspections/approve', async (req, res) => {
  try {
    const { postId, finalPrice, staffId, staffName, conditionNotes } = req.body;
    const conn = await getConnection();
    
    // Update car status
    await conn.query(
      'UPDATE Car_Posts SET Status = "Verified", FinalPrice = ? WHERE PostID = ?',
      [finalPrice, postId]
    );
    
    // Create inspection record
    await conn.query(
      'INSERT INTO Inspections (PostID, StaffID, StaffName, FinalPrice, ConditionNotes, InspectionDate) VALUES (?, ?, ?, ?, ?, NOW())',
      [postId, staffId, staffName, finalPrice, conditionNotes]
    );
    
    conn.release();
    res.json({ success: true, message: 'Car approved and added to showroom' });
  } catch (error) {
    console.error('Approve car error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Reject car (staff)
app.post('/api/inspections/reject', async (req, res) => {
  try {
    const { postId } = req.body;
    const conn = await getConnection();
    
    await conn.query('UPDATE Car_Posts SET Status = "Rejected" WHERE PostID = ?', [postId]);
    conn.release();
    
    res.json({ success: true, message: 'Car rejected' });
  } catch (error) {
    console.error('Reject car error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== APPOINTMENT ENDPOINTS ====================

// Get appointments for a car
app.get('/api/appointments/car/:carId', async (req, res) => {
  try {
    const conn = await getConnection();
    const [appointments] = await conn.query(
      'SELECT * FROM Appointments WHERE CarID = ? ORDER BY AppointmentDate ASC',
      [req.params.carId]
    );
    conn.release();
    
    res.json({ success: true, appointments });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create appointment (buyer)
app.post('/api/appointments', async (req, res) => {
  try {
    const { carId, buyerName, buyerEmail, buyerPhone, appointmentDate } = req.body;
    const conn = await getConnection();
    
    // Update car status to being viewed
    await conn.query(
      'UPDATE Car_Posts SET IsBeingViewed = 1 WHERE PostID = ?',
      [carId]
    );
    
    // Create appointment
    const [result] = await conn.query(
      'INSERT INTO Appointments (CarID, BuyerName, BuyerEmail, BuyerPhone, AppointmentDate, Status) VALUES (?, ?, ?, ?, ?, "Scheduled")',
      [carId, buyerName, buyerEmail, buyerPhone, appointmentDate]
    );
    conn.release();
    
    res.json({ success: true, message: 'Appointment booked', appointmentId: result.insertId });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== TRANSACTION ENDPOINTS ====================

// Record sale (owner)
app.post('/api/transactions/sale', async (req, res) => {
  try {
    const { postId, buyerName, buyerEmail, buyerPhone, salePrice } = req.body;
    const conn = await getConnection();
    
    // Get car details
    const [cars] = await conn.query('SELECT * FROM Car_Posts WHERE PostID = ?', [postId]);
    if (!cars[0]) {
      conn.release();
      return res.status(404).json({ message: 'Car not found' });
    }
    
    const car = cars[0];
    
    // Update car status to sold
    await conn.query('UPDATE Car_Posts SET Status = "Sold" WHERE PostID = ?', [postId]);
    
    // Create transaction record
    await conn.query(
      'INSERT INTO Transactions (CarID, BuyerName, BuyerEmail, BuyerPhone, SalePrice, TransactionDate, Status) VALUES (?, ?, ?, ?, ?, NOW(), "Completed")',
      [postId, buyerName, buyerEmail, buyerPhone, salePrice]
    );
    
    conn.release();
    res.json({ success: true, message: 'Sale recorded', transaction: { carModel: `${car.Make} ${car.Model}`, buyerName, salePrice } });
  } catch (error) {
    console.error('Record sale error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get sales history
app.get('/api/transactions/history', async (req, res) => {
  try {
    const conn = await getConnection();
    const [sales] = await conn.query(
      'SELECT t.*, c.Make, c.Model, c.Year FROM Transactions t JOIN Car_Posts c ON t.CarID = c.PostID ORDER BY t.TransactionDate DESC'
    );
    conn.release();
    
    res.json({ success: true, sales });
  } catch (error) {
    console.error('Get sales history error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== ANALYTICS ENDPOINTS ====================

// Get showroom stats
app.get('/api/analytics/stats', async (req, res) => {
  try {
    const conn = await getConnection();
    
    const [verified] = await conn.query("SELECT COUNT(*) as count FROM Car_Posts WHERE Status = 'Verified'");
    const [draft] = await conn.query("SELECT COUNT(*) as count FROM Car_Posts WHERE Status = 'Draft'");
    const [sold] = await conn.query("SELECT COUNT(*) as count FROM Car_Posts WHERE Status = 'Sold'");
    const [totalSales] = await conn.query("SELECT SUM(SalePrice) as total FROM Transactions WHERE Status = 'Completed'");
    
    conn.release();
    
    res.json({
      success: true,
      stats: {
        inShowroom: verified[0]?.count || 0,
        drafts: draft[0]?.count || 0,
        sold: sold[0]?.count || 0,
        totalRevenue: totalSales[0]?.total || 0,
        maxCapacity: 60
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running' });
});

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log(`\n🚀 AutoMall Backend running on http://localhost:${PORT}`);
  console.log(`✅ Database connected to automall`);
  console.log(`📡 CORS enabled for http://localhost:5173\n`);
});
