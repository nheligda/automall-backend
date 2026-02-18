import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'automall'
};

async function hashPasswords() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    // Get all users
    const [users] = await connection.execute('SELECT UserID, Email, Password FROM users');
    
    console.log(`Found ${users.length} users`);
    
    for (const user of users) {
      // Check if password is already hashed
      if (user.Password.startsWith('$2')) {
        console.log(`✓ ${user.Email} - already hashed`);
        continue;
      }
      
      // Hash the plain text password
      const hashedPassword = await bcrypt.hash(user.Password, 10);
      
      // Update the database
      await connection.execute(
        'UPDATE users SET Password = ? WHERE UserID = ?',
        [hashedPassword, user.UserID]
      );
      
      console.log(`✓ ${user.Email} - hashed successfully`);
    }
    
    console.log('\nAll passwords have been hashed!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

hashPasswords();
