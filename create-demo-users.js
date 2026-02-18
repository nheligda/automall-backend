import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'automall'
});

async function createDemoUsers() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🔄 Creating demo users...\n');
    
    const demoUsers = [
      { id: 1, name: 'Owner User', email: 'owner@automall.com', password: 'owner123', role: 'Owner' },
      { id: 2, name: 'Staff Member', email: 'staff@automall.com', password: 'staff123', role: 'Staff' },
      { id: 3, name: 'Car Seller', email: 'seller@automall.com', password: 'seller123', role: 'Seller' }
    ];
    
    for (const user of demoUsers) {
      await connection.query(
        'INSERT INTO Users (UserID, Name, Email, Password, Role) VALUES (?, ?, ?, ?, ?)',
        [user.id, user.name, user.email, user.password, user.role]
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
    process.exit(0);
  }
}

createDemoUsers();
