const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// MySQL connection
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'automall',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function directSync() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🔄 Starting direct sync to MySQL...\n');
    
    // Read localStorage data (you need to copy this from browser)
    const data = {
      users: [
        { UserID: '1', Name: 'Owner', Email: 'owner@automall.com', Password: 'owner123', Role: 'Owner' },
        { UserID: '2', Name: 'Staff', Email: 'staff@automall.com', Password: 'staff123', Role: 'Staff' },
        { UserID: '3', Name: 'Seller', Email: 'seller@automall.com', Password: 'seller123', Role: 'Seller' },
        { UserID: '4', Name: 'Buyer', Email: 'buyer@automall.com', Password: 'buyer123', Role: 'Buyer' },
        { UserID: '5', Name: 'nhel', Email: 'nhel@test.com', Password: 'pass', Role: 'Seller' },
        { UserID: '6', Name: 'le', Email: 'le@gmail.com', Password: 'pass', Role: 'Seller' }
      ],
      carPosts: [], // Will be added from browser data
      appointments: [],
      inspections: [],
      transactions: []
    };
    
    // Clear existing data
    await connection.query('DELETE FROM Transactions');
    await connection.query('DELETE FROM Appointments');
    await connection.query('DELETE FROM Inspections');
    await connection.query('DELETE FROM Car_Posts');
    await connection.query('DELETE FROM Users');
    
    console.log('✓ Cleared existing data\n');
    
    // Insert users
    for (const user of data.users) {
      await connection.query(
        'INSERT INTO Users (UserID, Name, Email, Password, Role) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE Name=VALUES(Name), Password=VALUES(Password), Role=VALUES(Role)',
        [user.UserID, user.Name, user.Email, user.Password, user.Role]
      );
    }
    console.log(`✓ Synced ${data.users.length} users`);
    
    // Insert car posts
    for (const car of data.carPosts) {
      await connection.query(
        `INSERT INTO Car_Posts (PostID, SellerID, Make, Model, Year, Color, Mileage, Condition, Price, Description, ImageURL, Status, CreatedAt, VerifiedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE Make=VALUES(Make), Model=VALUES(Model), Price=VALUES(Price), Status=VALUES(Status)`,
        [
          car.PostID, car.SellerID, car.Make, car.Model, car.Year, car.Color, 
          car.Mileage, car.Condition, car.Price, car.Description, car.ImageURL,
          car.Status, car.CreatedAt, car.VerifiedAt
        ]
      );
    }
    console.log(`✓ Synced ${data.carPosts.length} car posts`);
    
    // Insert appointments
    for (const apt of data.appointments) {
      await connection.query(
        `INSERT INTO Appointments (ApptID, PostID, BuyerName, BuyerEmail, BuyerContact, ApptDate, Status, CreatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE Status=VALUES(Status)`,
        [apt.ApptID, apt.PostID, apt.BuyerName, apt.BuyerEmail, apt.BuyerContact, apt.ApptDate, apt.Status, apt.CreatedAt]
      );
    }
    console.log(`✓ Synced ${data.appointments.length} appointments`);
    
    // Insert inspections
    for (const insp of data.inspections) {
      await connection.query(
        `INSERT INTO Inspections (InspectionID, PostID, InspectorID, InspectionDate, Notes, Status)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE Status=VALUES(Status)`,
        [insp.InspectionID, insp.PostID, insp.InspectorID, insp.InspectionDate, insp.Notes, insp.Status]
      );
    }
    console.log(`✓ Synced ${data.inspections.length} inspections`);
    
    console.log('\n✅ Direct sync completed successfully!');
    console.log('🎉 All data is now in MySQL!');
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
  } finally {
    connection.release();
    process.exit(0);
  }
}

directSync();
