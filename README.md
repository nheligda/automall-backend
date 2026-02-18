# AutoMall Backend API

Backend server for AutoMall Proxy Showroom management system.

## Features
- RESTful API for car listings, users, appointments, and sales
- MySQL database integration
- Bcrypt password hashing
- CORS enabled for frontend

## Tech Stack
- Node.js + Express
- MySQL
- Bcrypt for authentication

## Environment Variables
Required environment variables (set in Railway):
```
DB_HOST=<your-mysql-host>
DB_USER=<your-mysql-user>
DB_PASSWORD=<your-mysql-password>
DB_NAME=<your-database-name>
DB_PORT=3306
PORT=5000
```

## Deployment
This backend is configured for Railway deployment with MySQL database.

## Local Development
1. Install dependencies: `npm install`
2. Create `.env` file with database credentials
3. Run: `npm start`

## API Endpoints
- POST `/api/login` - User authentication
- POST `/api/register` - User registration
- GET `/api/cars/showroom` - Get all showroom cars
- POST `/api/cars` - Create new car listing
- And more...

## Author
AutoMall Team
