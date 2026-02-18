import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'automall'
});

async function syncFromFile() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🔄 Reading browser-data.json...\n');
    
    const dataPath = path.join(__dirname, '..', 'browser-data.json');
    if (!fs.existsSync(dataPath)) {
      console.error('❌ File not found: browser-data.json');
      console.log('💡 Go to http://localhost/capstone-project/copy-data.html');
      console.log('💡 Click the button to copy data, then paste it into browser-data.json');
      process.exit(1);
    }
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    console.log('📊 Data found:');
    console.log(`   Users: ${data.users?.length || 0}`);
    console.log(`   Cars: ${data.car_posts?.length || 0}`);
    console.log(`   Appointments: ${data.appointments?.length || 0}`);
    console.log(`   Inspections: ${data.inspections?.length || 0}\n`);
    
    // Clear tables
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE Transactions');
    await connection.query('TRUNCATE TABLE Appointments');
    await connection.query('TRUNCATE TABLE Inspections');
    await connection.query('TRUNCATE TABLE Car_Posts');
    await connection.query('TRUNCATE TABLE Users');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✓ Cleared existing data\n');
    
    // Insert users
    if (data.users) {
      let userIdCounter = 1;
      for (const user of data.users) {
        // Use sequential IDs for large numbers
        const userId = user.UserID.length > 5 ? String(userIdCounter + 100) : user.UserID;
        userIdCounter++;
        
        await connection.query(
          'INSERT INTO Users (UserID, Name, Email, Password, Role) VALUES (?, ?, ?, ?, ?)',
          [userId, user.Name, user.Email, user.Password, user.Role]
        );
      }
      console.log(`✅ Synced ${data.users.length} users`);
    }
    
    // Insert car posts
    if (data.car_posts) {
      let carIdCounter = 1;
      for (const car of data.car_posts) {
        // Convert large IDs to smaller ones if needed
        const postId = car.PostID.length > 5 ? String(carIdCounter + 100) : car.PostID;
        const sellerId = car.SellerID.length > 5 ? '3' : car.SellerID; // Default to seller ID 3
        carIdCounter++;
        
        await connection.query(
          `INSERT INTO Car_Posts (PostID, SellerID, SellerName, Make, Model, Year, Color, Mileage, \`Condition\`, ExpectedPrice, FinalPrice, Description, Photos, Status, CreatedAt, ApprovedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            postId, sellerId, car.SellerName, car.Make, car.Model, car.Year, car.Color,
            car.Mileage, car.Condition, car.ExpectedPrice, car.ExpectedPrice, 
            car.Description, JSON.stringify(car.Photos || []),
            car.Status, car.CreatedAt, car.VerifiedAt || null
          ]
        );
      }
      console.log(`✅ Synced ${data.car_posts.length} car posts`);
    }
    
    // Insert appointments
    if (data.appointments) {
      for (const apt of data.appointments) {
        await connection.query(
          `INSERT INTO Appointments (ApptID, PostID, BuyerName, BuyerEmail, BuyerContact, ApptDate, Status, CreatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [apt.ApptID, apt.PostID, apt.BuyerName, apt.BuyerEmail, apt.BuyerContact, apt.ApptDate, apt.Status, apt.CreatedAt]
        );
      }
      console.log(`✅ Synced ${data.appointments.length} appointments`);
    }
    
    // Insert inspections
    if (data.inspections) {
      for (const insp of data.inspections) {
        const postId = insp.PostID.length > 5 ? String(parseInt(insp.PostID.slice(-3)) + 100) : insp.PostID;
        const staffId = insp.StaffID.length > 5 ? '2' : insp.StaffID;
        
        try {
          await connection.query(
            `INSERT INTO Inspections (InspectionID, PostID, StaffID, StaffName, FinalPrice, ConditionNotes, InspectionDate)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [insp.InspectionID, postId, staffId, insp.StaffName, insp.FinalPrice, insp.ConditionNotes, insp.InspectionDate]
          );
        } catch (err) {
          console.log(`  ⚠️ Skipped inspection ${insp.InspectionID}: ${err.message}`);
        }
      }
      console.log(`✅ Synced inspections`);
    }
    
    console.log('\n🎉 ALL DATA SYNCED TO MYSQL!');
    console.log('✓ Check phpMyAdmin to verify');
    console.log('✓ Data is now available in other browsers\n');
    
  } catch (error) {
    console.error('\n❌ Sync failed:', error.message);
  } finally {
    connection.release();
    await pool.end();
    process.exit(0);
  }
}

syncFromFile();
