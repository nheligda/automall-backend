import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'automall'
});

async function fixUsers() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🔄 Clearing existing demo users...');
    await connection.query('DELETE FROM Users WHERE UserID IN (1, 2, 3)');
    console.log('✅ Cleared old users');
    
    console.log('🔄 Creating new demo users with hashed passwords...');
    
    const demoUsers = [
      { id: 1, name: 'Owner User', email: 'owner@automall.com', password: 'owner123', role: 'Owner' },
      { id: 2, name: 'Staff Member', email: 'staff@automall.com', password: 'staff123', role: 'Staff' },
      { id: 3, name: 'Car Seller', email: 'seller@automall.com', password: 'seller123', role: 'Seller' }
    ];
    
    for (const user of demoUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await connection.query(
        'INSERT INTO Users (UserID, Name, Email, Password, Role) VALUES (?, ?, ?, ?, ?)',
        [user.id, user.name, user.email, hashedPassword, user.role]
      );
      console.log(`✅ Created: ${user.email} / ${user.password}`);
    }
    
    console.log('\n🎉 Demo users created successfully!');
    console.log('\n📝 You can now login with:');
    console.log('   Owner: owner@automall.com / owner123');
    console.log('   Staff: staff@automall.com / staff123');
    console.log('   Seller: seller@automall.com / seller123');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    connection.release();
    await pool.end();
  }
}

fixUsers();
