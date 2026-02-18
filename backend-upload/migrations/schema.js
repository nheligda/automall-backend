import pool from '../config/database.js';

export const initializeDatabase = async () => {
  try {
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

    // Initialize Showroom (one record)
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
  } catch (error) {
    console.error('✗ Database initialization error:', error.message);
    throw error;
  }
};

export default initializeDatabase;
