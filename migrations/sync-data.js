import pool from '../config/database.js';

/**
 * Sync data from localStorage (passed as argument) to MySQL database
 * This allows data migration from the React app to the backend
 */

export const syncLocalStorageToDatabase = async (data) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Sync Users
    if (data.users && Array.isArray(data.users)) {
      console.log(`📝 Syncing ${data.users.length} users...`);
      for (const user of data.users) {
        await connection.query(
          `INSERT IGNORE INTO Users (UserID, Name, Email, Password, Role, CreatedAt) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [user.UserID, user.Name, user.Email, user.Password, user.Role, user.CreatedAt || new Date()]
        );
      }
    }

    // Sync Car Posts
    if (data.carPosts && Array.isArray(data.carPosts)) {
      console.log(`🚗 Syncing ${data.carPosts.length} car posts...`);
      for (const car of data.carPosts) {
        await connection.query(
          `INSERT IGNORE INTO Car_Posts 
           (PostID, SellerID, SellerName, Make, Model, Year, Photos, ExpectedPrice, 
            FinalPrice, Color, Mileage, \`Condition\`, Description, Status, CreatedAt, ApprovedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            car.PostID,
            car.SellerID,
            car.SellerName,
            car.Make,
            car.Model,
            car.Year,
            JSON.stringify(car.Photos || []),
            car.ExpectedPrice,
            car.FinalPrice,
            car.Color,
            car.Mileage,
            car.Condition,
            car.Description,
            car.Status || 'Draft',
            car.CreatedAt,
            car.ApprovedAt
          ]
        );
      }
    }

    // Sync Inspections
    if (data.inspections && Array.isArray(data.inspections)) {
      console.log(`🔍 Syncing ${data.inspections.length} inspections...`);
      for (const insp of data.inspections) {
        await connection.query(
          `INSERT IGNORE INTO Inspections 
           (InspectionID, PostID, StaffID, StaffName, FinalPrice, ConditionNotes, InspectionDate) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            insp.InspectionID,
            insp.PostID,
            insp.StaffID,
            insp.StaffName,
            insp.FinalPrice,
            insp.ConditionNotes,
            insp.InspectionDate
          ]
        );
      }
    }

    // Sync Appointments
    if (data.appointments && Array.isArray(data.appointments)) {
      console.log(`📅 Syncing ${data.appointments.length} appointments...`);
      for (const appt of data.appointments) {
        await connection.query(
          `INSERT IGNORE INTO Appointments 
           (ApptID, PostID, BuyerName, BuyerEmail, BuyerContact, ApptDate, Status, CreatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            appt.ApptID,
            appt.PostID,
            appt.BuyerName,
            appt.BuyerEmail,
            appt.BuyerContact,
            appt.ApptDate,
            appt.Status || 'Scheduled',
            appt.CreatedAt || new Date()
          ]
        );
      }
    }

    // Sync Transactions
    if (data.transactions && Array.isArray(data.transactions)) {
      console.log(`💳 Syncing ${data.transactions.length} transactions...`);
      for (const trans of data.transactions) {
        await connection.query(
          `INSERT IGNORE INTO Transactions 
           (SaleID, PostID, BuyerID, BuyerName, BuyerEmail, BuyerPhone, FinalSalePrice, DateSold) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            trans.SaleID,
            trans.PostID,
            trans.BuyerID,
            trans.BuyerName,
            trans.BuyerEmail,
            trans.BuyerPhone,
            trans.FinalSalePrice,
            trans.DateSold
          ]
        );
      }
    }

    await connection.commit();
    console.log('✅ Data sync completed successfully!');
    return { success: true, message: 'Data synced to database' };
  } catch (error) {
    await connection.rollback();
    console.error('❌ Sync failed:', error);
    throw error;
  } finally {
    connection.release();
  }
};

export default syncLocalStorageToDatabase;
