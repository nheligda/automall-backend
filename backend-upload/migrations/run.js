import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const createDatabase = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'automall'}\``);
    console.log('✓ Database created');
    connection.end();
  } catch (error) {
    console.error('✗ Error creating database:', error.message);
    throw error;
  }
};

const initializeSchema = async () => {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'automall',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Create Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Users (
        UserID INT AUTO_INCREMENT PRIMARY KEY,
        Name VARCHAR(100) NOT NULL,
        Email VARCHAR(100) UNIQUE NOT NULL,
        Password VARCHAR(255) NOT NULL,
        Role ENUM('Owner', 'Staff', 'Seller') NOT NULL,
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Car_Posts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Car_Posts (
        PostID INT AUTO_INCREMENT PRIMARY KEY,
        SellerID INT NOT NULL,
        SellerName VARCHAR(100),
        Make VARCHAR(50),
        Model VARCHAR(50),
        Year INT,
        Photos JSON,
        ExpectedPrice DECIMAL(10, 2),
        FinalPrice DECIMAL(10, 2),
        Color VARCHAR(50),
        Mileage INT,
        \`Condition\` VARCHAR(50),
        Description TEXT,
        Status ENUM('Draft', 'Verified', 'Sold', 'Rejected') DEFAULT 'Draft',
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ApprovedAt TIMESTAMP NULL,
        FOREIGN KEY (SellerID) REFERENCES Users(UserID) ON DELETE CASCADE
      )
    `);

    // Create Showroom table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Showroom (
        ShowroomID INT PRIMARY KEY,
        CurrentCount INT DEFAULT 0,
        MaxCapacity INT DEFAULT 60,
        LastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Initialize Showroom
    const [showroom] = await pool.query('SELECT * FROM Showroom WHERE ShowroomID = 1');
    if (showroom.length === 0) {
      await pool.query('INSERT INTO Showroom (ShowroomID, CurrentCount, MaxCapacity) VALUES (1, 0, 60)');
    }

    // Create Inspections table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Inspections (
        InspectionID INT AUTO_INCREMENT PRIMARY KEY,
        PostID INT NOT NULL UNIQUE,
        StaffID INT NOT NULL,
        StaffName VARCHAR(100),
        FinalPrice DECIMAL(10, 2) NOT NULL,
        ConditionNotes TEXT,
        InspectionDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (PostID) REFERENCES Car_Posts(PostID) ON DELETE CASCADE,
        FOREIGN KEY (StaffID) REFERENCES Users(UserID) ON DELETE CASCADE
      )
    `);

    // Create Appointments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Appointments (
        ApptID INT AUTO_INCREMENT PRIMARY KEY,
        PostID INT NOT NULL,
        BuyerName VARCHAR(100),
        BuyerEmail VARCHAR(100),
        BuyerContact VARCHAR(20),
        ApptDate DATETIME,
        Status ENUM('Scheduled', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (PostID) REFERENCES Car_Posts(PostID) ON DELETE CASCADE
      )
    `);

    // Create Transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Transactions (
        SaleID INT AUTO_INCREMENT PRIMARY KEY,
        PostID INT NOT NULL UNIQUE,
        BuyerID INT,
        BuyerName VARCHAR(100),
        BuyerEmail VARCHAR(100),
        BuyerPhone VARCHAR(20),
        FinalSalePrice DECIMAL(10, 2) NOT NULL,
        DateSold TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (PostID) REFERENCES Car_Posts(PostID) ON DELETE CASCADE,
        FOREIGN KEY (BuyerID) REFERENCES Users(UserID) ON DELETE SET NULL
      )
    `);

    // Create Swap_Requests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS Swap_Requests (
        SwapID INT AUTO_INCREMENT PRIMARY KEY,
        TargetPostID INT NOT NULL,
        BuyerCarDetails JSON,
        Status ENUM('Pending', 'Approved', 'Rejected', 'Completed') DEFAULT 'Pending',
        CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (TargetPostID) REFERENCES Car_Posts(PostID) ON DELETE CASCADE
      )
    `);

    console.log('✓ Database schema initialized successfully');
    pool.end();
  } catch (error) {
    console.error('✗ Schema initialization error:', error.message);
    throw error;
  }
};

const seedDatabase = async () => {
  try {
    console.log('🔄 Seeding database with sample data (idempotent)...');

    const pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'automall',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Hash password for demo accounts
    const hashedPassword = await bcrypt.hash('password123', 10);

    const insertUserQuery = 'INSERT INTO Users (Name, Email, Password, Role) VALUES (?, ?, ?, ?)';

    async function ensureUser(name, email, role) {
      const [rows] = await pool.query('SELECT UserID FROM Users WHERE Email = ?', [email]);
      if (rows.length === 0) {
        const [res] = await pool.query(insertUserQuery, [name, email, hashedPassword, role]);
        return res.insertId;
      }
      return rows[0].UserID;
    }

    const ownerId = await ensureUser('Owner User', 'owner@automall.com', 'Owner');
    const staffId = await ensureUser('Staff Member', 'staff@automall.com', 'Staff');
    const seller1Id = await ensureUser('John Seller', 'seller1@automall.com', 'Seller');
    const seller2Id = await ensureUser('Jane Doe', 'seller2@automall.com', 'Seller');
    const buyerId = await ensureUser('Buyer User', 'buyer@example.com', 'Buyer');

    // Upsert sample cars (only insert if not already present)
    const carCheckQuery = 'SELECT PostID FROM Car_Posts WHERE SellerID = ? AND Make = ? AND Model = ? AND Year = ? LIMIT 1';
    const carsInsertQuery = `
      INSERT INTO Car_Posts (SellerID, SellerName, Make, Model, Year, Photos, ExpectedPrice, Color, Mileage, \`Condition\`, Description, Status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const cars = [
      [seller1Id, 'John Seller', 'Toyota', 'Camry', 2020, JSON.stringify(['photo1.jpg']), 22000, 'Silver', 45000, 'Good', 'Well maintained sedan', 'Verified'],
      [seller1Id, 'John Seller', 'Honda', 'Civic', 2019, JSON.stringify(['photo2.jpg']), 18000, 'Blue', 55000, 'Excellent', 'Like new condition', 'Verified'],
      [seller2Id, 'Jane Doe', 'Ford', 'F-150', 2021, JSON.stringify(['photo3.jpg']), 38000, 'Red', 30000, 'Excellent', 'Truck in perfect condition', 'Verified'],
      [seller1Id, 'John Seller', 'BMW', 'X3', 2022, JSON.stringify(['photo4.jpg']), 45000, 'Black', 15000, 'Like New', 'Luxury SUV, showroom condition', 'Verified'],
      [seller2Id, 'Jane Doe', 'Tesla', 'Model 3', 2023, JSON.stringify(['photo5.jpg']), 50000, 'White', 5000, 'Mint', 'Brand new electric vehicle', 'Verified']
    ];

    for (const car of cars) {
      const [check] = await pool.query(carCheckQuery, [car[0], car[2], car[3], car[4]]);
      if (check.length === 0) {
        await pool.query(carsInsertQuery, car);
      }
    }

    // Recalculate showroom count based on Verified cars
    const [cntRows] = await pool.query("SELECT COUNT(*) AS cnt FROM Car_Posts WHERE Status = 'Verified'");
    const verifiedCount = cntRows[0].cnt || 0;
    await pool.query('UPDATE Showroom SET CurrentCount = ? WHERE ShowroomID = 1', [verifiedCount]);

    console.log('✓ Database seeded (idempotent) successfully');
    console.log('  Demo Users:');
    console.log('  - Owner: owner@automall.com / password123');
    console.log('  - Staff: staff@automall.com / password123');
    console.log('  - Seller: seller1@automall.com / password123');
    console.log('  - Jane Doe: seller2@automall.com / password123');
    console.log('  - Buyer: buyer@example.com / password123');
    pool.end();
  } catch (error) {
    console.error('✗ Seeding error:', error.message);
  }
};

const runMigrations = async () => {
  try {
    console.log('🚀 Running database migrations...');
    await createDatabase();
    await initializeSchema();
    await seedDatabase();
    console.log('✓ All migrations completed');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  }
};

runMigrations();
