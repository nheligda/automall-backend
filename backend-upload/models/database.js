import pool from '../config/database.js';

// ==================== USERS ====================
export const getAllUsers = async () => {
  const [rows] = await pool.query('SELECT * FROM Users');
  return rows;
};

export const getUserByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM Users WHERE Email = ?', [email]);
  return rows[0] || null;
};

export const getUserById = async (userId) => {
  const [rows] = await pool.query('SELECT * FROM Users WHERE UserID = ?', [userId]);
  return rows[0] || null;
};

export const createUser = async (name, email, password, role) => {
  const [result] = await pool.query(
    'INSERT INTO Users (Name, Email, Password, Role) VALUES (?, ?, ?, ?)',
    [name, email, password, role]
  );
  return { UserID: result.insertId, Name: name, Email: email, Password: password, Role: role };
};

export const deleteUser = async (userId) => {
  await pool.query('DELETE FROM Users WHERE UserID = ?', [userId]);
};

// ==================== CAR POSTS ====================
export const createCarPost = async (sellerId, sellerName, make, model, year, photos, expectedPrice, color, mileage, condition, description) => {
  const [result] = await pool.query(
    `INSERT INTO Car_Posts (SellerID, SellerName, Make, Model, Year, Photos, ExpectedPrice, Color, Mileage, \`Condition\`, Description, Status, CreatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', NOW())`,
    [sellerId, sellerName, make, model, year, JSON.stringify(photos), expectedPrice, color, mileage, condition, description]
  );
  return { PostID: result.insertId, SellerID: sellerId, Status: 'Draft', CreatedAt: new Date() };
};

export const getCarPostById = async (postId) => {
  const [rows] = await pool.query('SELECT * FROM Car_Posts WHERE PostID = ?', [postId]);
  if (rows[0]) {
    rows[0].Photos = JSON.parse(rows[0].Photos || '[]');
  }
  return rows[0] || null;
};

export const getCarPostsBySeller = async (sellerId) => {
  const [rows] = await pool.query('SELECT * FROM Car_Posts WHERE SellerID = ?', [sellerId]);
  return rows.map(row => ({
    ...row,
    Photos: JSON.parse(row.Photos || '[]')
  }));
};

export const getDraftCarPosts = async () => {
  const [rows] = await pool.query("SELECT * FROM Car_Posts WHERE Status = 'Draft'");
  return rows.map(row => ({
    ...row,
    Photos: JSON.parse(row.Photos || '[]')
  }));
};

export const getVerifiedCarPosts = async () => {
  const [rows] = await pool.query("SELECT * FROM Car_Posts WHERE Status = 'Verified'");
  return rows.map(row => ({
    ...row,
    Photos: JSON.parse(row.Photos || '[]')
  }));
};

export const updateCarPostStatus = async (postId, status) => {
  await pool.query('UPDATE Car_Posts SET Status = ? WHERE PostID = ?', [status, postId]);
  return getCarPostById(postId);
};

export const deleteCarPost = async (postId) => {
  await pool.query('DELETE FROM Car_Posts WHERE PostID = ?', [postId]);
};

// ==================== INSPECTIONS ====================
export const createInspection = async (postId, staffId, staffName, finalPrice, conditionNotes) => {
  const [result] = await pool.query(
    `INSERT INTO Inspections (PostID, StaffID, StaffName, FinalPrice, ConditionNotes, InspectionDate)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [postId, staffId, staffName, finalPrice, conditionNotes]
  );
  return { InspectionID: result.insertId, PostID: postId, FinalPrice: finalPrice };
};

export const getInspectionByPost = async (postId) => {
  const [rows] = await pool.query('SELECT * FROM Inspections WHERE PostID = ?', [postId]);
  return rows[0] || null;
};

export const getInspectionsByStaff = async (staffId) => {
  const [rows] = await pool.query('SELECT * FROM Inspections WHERE StaffID = ?', [staffId]);
  return rows;
};

export const updateInspection = async (inspectionId, finalPrice, conditionNotes) => {
  await pool.query(
    'UPDATE Inspections SET FinalPrice = ?, ConditionNotes = ? WHERE InspectionID = ?',
    [finalPrice, conditionNotes, inspectionId]
  );
  const [rows] = await pool.query('SELECT * FROM Inspections WHERE InspectionID = ?', [inspectionId]);
  return rows[0];
};

// ==================== APPOINTMENTS ====================
export const createAppointment = async (postId, buyerName, buyerEmail, buyerContact, apptDate) => {
  const [result] = await pool.query(
    `INSERT INTO Appointments (PostID, BuyerName, BuyerEmail, BuyerContact, ApptDate, Status)
     VALUES (?, ?, ?, ?, ?, 'Scheduled')`,
    [postId, buyerName, buyerEmail, buyerContact, apptDate]
  );
  return { ApptID: result.insertId, PostID: postId, Status: 'Scheduled' };
};

export const getAppointmentsByPost = async (postId) => {
  const [rows] = await pool.query('SELECT * FROM Appointments WHERE PostID = ?', [postId]);
  return rows;
};

export const getAllAppointments = async () => {
  const [rows] = await pool.query('SELECT * FROM Appointments');
  return rows;
};

export const updateAppointmentStatus = async (apptId, status) => {
  await pool.query('UPDATE Appointments SET Status = ? WHERE ApptID = ?', [status, apptId]);
  const [rows] = await pool.query('SELECT * FROM Appointments WHERE ApptID = ?', [apptId]);
  return rows[0];
};

// ==================== TRANSACTIONS ====================
export const createTransaction = async (postId, buyerId, buyerName, buyerEmail, buyerPhone, finalSalePrice) => {
  const [result] = await pool.query(
    `INSERT INTO Transactions (PostID, BuyerID, BuyerName, BuyerEmail, BuyerPhone, FinalSalePrice, DateSold)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [postId, buyerId, buyerName, buyerEmail, buyerPhone, finalSalePrice]
  );
  return { SaleID: result.insertId, PostID: postId, FinalSalePrice: finalSalePrice };
};

export const getTransactionByPost = async (postId) => {
  const [rows] = await pool.query('SELECT * FROM Transactions WHERE PostID = ?', [postId]);
  return rows[0] || null;
};

export const getAllTransactions = async () => {
  const [rows] = await pool.query('SELECT * FROM Transactions');
  return rows;
};

// ==================== SWAP REQUESTS ====================
export const createSwapRequest = async (targetPostId, buyerCarDetails, status = 'Pending') => {
  const [result] = await pool.query(
    `INSERT INTO Swap_Requests (TargetPostID, BuyerCarDetails, Status, CreatedAt, UpdatedAt)
     VALUES (?, ?, ?, NOW(), NOW())`,
    [targetPostId, JSON.stringify(buyerCarDetails), status]
  );
  return { SwapID: result.insertId, TargetPostID: targetPostId, Status: status };
};

export const getSwapRequestsByTargetPost = async (targetPostId) => {
  const [rows] = await pool.query('SELECT * FROM Swap_Requests WHERE TargetPostID = ?', [targetPostId]);
  return rows.map(row => ({
    ...row,
    BuyerCarDetails: JSON.parse(row.BuyerCarDetails)
  }));
};

export const getAllSwapRequests = async () => {
  const [rows] = await pool.query('SELECT * FROM Swap_Requests');
  return rows.map(row => ({
    ...row,
    BuyerCarDetails: JSON.parse(row.BuyerCarDetails)
  }));
};

export const updateSwapRequestStatus = async (swapId, status) => {
  await pool.query('UPDATE Swap_Requests SET Status = ?, UpdatedAt = NOW() WHERE SwapID = ?', [status, swapId]);
  const [rows] = await pool.query('SELECT * FROM Swap_Requests WHERE SwapID = ?', [swapId]);
  return {
    ...rows[0],
    BuyerCarDetails: JSON.parse(rows[0].BuyerCarDetails)
  };
};

// ==================== SHOWROOM ====================
export const getShowroomStatus = async () => {
  const [rows] = await pool.query('SELECT * FROM Showroom LIMIT 1');
  return rows[0] || { ShowroomID: 1, CurrentCount: 0, MaxCapacity: 60, LastUpdated: new Date() };
};

export const increaseShowroomCount = async () => {
  await pool.query(
    'UPDATE Showroom SET CurrentCount = CurrentCount + 1, LastUpdated = NOW() WHERE ShowroomID = 1'
  );
};

export const decreaseShowroomCount = async () => {
  await pool.query(
    'UPDATE Showroom SET CurrentCount = GREATEST(0, CurrentCount - 1), LastUpdated = NOW() WHERE ShowroomID = 1'
  );
};

export const hasShowroomSpace = async () => {
  const showroom = await getShowroomStatus();
  return showroom.CurrentCount < showroom.MaxCapacity;
};

// ==================== ANALYTICS ====================
export const getTotalRevenue = async () => {
  const [rows] = await pool.query('SELECT SUM(FinalSalePrice) as total FROM Transactions');
  return rows[0].total || 0;
};

export const getTotalSalesCount = async () => {
  const [rows] = await pool.query('SELECT COUNT(*) as count FROM Transactions');
  return rows[0].count || 0;
};
