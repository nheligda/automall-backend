import fetch from 'node-fetch';

const loginData = {
  email: 'le@gmail.com',
  password: '123123123'
};

try {
  const response = await fetch('http://localhost:5000/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(loginData)
  });

  const data = await response.json();
  
  console.log('Response status:', response.status);
  console.log('Response data:', JSON.stringify(data, null, 2));
} catch (error) {
  console.error('Error:', error.message);
}
