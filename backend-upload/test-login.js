import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const conn = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'automall'
});

const [rows] = await conn.execute('SELECT Email, Password, Role FROM users WHERE Email = ?', ['le@gmail.com']);
const user = rows[0];

console.log('User found:', user.Email);
console.log('Password hash:', user.Password);
console.log('Role:', user.Role);

// Test password comparison
const testPassword = '123123123';
const isValid = await bcrypt.compare(testPassword, user.Password);

console.log('\nPassword test:');
console.log('Testing password:', testPassword);
console.log('Match result:', isValid);

await conn.end();
