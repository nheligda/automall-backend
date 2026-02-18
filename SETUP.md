# AutoMall Backend Setup Guide

## Prerequisites

1. **XAMPP Installed** - Download from [apachefriends.org](https://www.apachefriends.org)
2. **Node.js 16+** - Download from [nodejs.org](https://nodejs.org)
3. **MySQL running** - Start Apache and MySQL services in XAMPP Control Panel

## Installation Steps

### 1. Start XAMPP Services

1. Open XAMPP Control Panel
2. Click "Start" next to **MySQL** (port 3306)
3. Verify MySQL is running (green indicator)

### 2. Create Database

Open phpMyAdmin (http://localhost/phpmyadmin) and run:

```sql
CREATE DATABASE IF NOT EXISTS automall;
```

Or via terminal in XAMPP MySQL:

```bash
mysql -u root -p
CREATE DATABASE automall;
EXIT;
```

### 3. Install Backend Dependencies

```bash
cd backend
npm install
```

### 4. Configure Environment

The `.env` file is already configured for XAMPP default settings:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=        # Leave empty for XAMPP default
DB_NAME=automall
SERVER_PORT=5000
CORS_ORIGIN=http://localhost:5173
```

**If your XAMPP MySQL password is different**, update `.env`:
```
DB_PASSWORD=your_mysql_password
```

### 5. Initialize Database Schema

Run migrations to create all tables:

```bash
npm run migrate
```

**Expected output:**
```
🔄 Running database migrations...
🚀 Running database migrations...
✓ Database schema initialized successfully
✓ Database seeded successfully
✓ All migrations completed
```

### 6. Start Backend Server

```bash
npm start
```

**Expected output:**
```
✓ AutoMall Backend Server running on http://localhost:5000
✓ CORS enabled for: http://localhost:5173
✓ API Health Check: http://localhost:5000/api/health
```

### 7. Test API Connection

Visit: http://localhost:5000/api/health

Should return:
```json
{
  "status": "OK",
  "message": "AutoMall Backend is running"
}
```

### 8. Start React Frontend

In a new terminal:

```bash
cd react-ui
npm install  # if not already installed
npm run dev
```

Frontend will be available at: http://localhost:5173

## Database Schema

The following tables are automatically created:

- **Users** - Owner, Staff, Seller accounts
- **Car_Posts** - Vehicle listings (Draft → Verified → Sold)
- **Showroom** - Capacity tracking (max 60 cars)
- **Inspections** - Staff verification of cars
- **Appointments** - Buyer viewing appointments
- **Transactions** - Sale records
- **Swap_Requests** - Trade-in requests

## API Endpoints

### Users
- `POST /api/users/register` - Create new user
- `POST /api/users/login` - Authenticate user
- `GET /api/users` - List all users
- `DELETE /api/users/:userId` - Delete user

### Cars
- `POST /api/cars` - Create car post
- `GET /api/cars/:postId` - Get car by ID
- `GET /api/cars/seller/:sellerId` - Get seller's cars
- `GET /api/cars/status/draft` - Get draft posts
- `GET /api/cars/status/verified` - Get verified cars (catalog)
- `PUT /api/cars/:postId/status` - Update car status
- `DELETE /api/cars/:postId` - Delete draft car

### Inspections
- `POST /api/inspections` - Create inspection
- `GET /api/inspections/post/:postId` - Get inspection by post
- `GET /api/inspections/staff/:staffId` - Get staff's inspections
- `PUT /api/inspections/:inspectionId` - Update inspection

### Appointments
- `POST /api/appointments` - Book appointment
- `GET /api/appointments/post/:postId` - Get car's appointments
- `GET /api/appointments` - Get all appointments
- `PUT /api/appointments/:apptId/status` - Update appointment status

### Transactions
- `POST /api/transactions` - Record sale
- `GET /api/transactions/post/:postId` - Get sale by post
- `GET /api/transactions` - Get all sales

### Swaps
- `POST /api/swaps` - Create swap request
- `GET /api/swaps/post/:targetPostId` - Get target's swap requests
- `GET /api/swaps` - Get all swap requests
- `PUT /api/swaps/:swapId/status` - Update swap status

### Showroom
- `GET /api/showroom/status` - Get current capacity
- `GET /api/showroom/check-space` - Check if space available
- `POST /api/showroom/increase` - Increase count
- `POST /api/showroom/decrease` - Decrease count

## Development with Nodemon

For automatic restart on file changes:

```bash
npm run dev
```

## Troubleshooting

### MySQL Connection Error
```
✗ MySQL Connection Error: connect ECONNREFUSED
```
**Solution**: Ensure XAMPP MySQL service is running

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Change `SERVER_PORT` in `.env` or kill process on port 5000

### CORS Errors in Frontend
**Solution**: Ensure `CORS_ORIGIN` in `.env` matches React dev server URL (http://localhost:5173)

### Database Not Found
```
Error: ER_BAD_DB_ERROR: Unknown database 'automall'
```
**Solution**: Create database in phpMyAdmin first

## Next Steps

1. ✅ Backend server running on http://localhost:5000
2. ✅ MySQL database initialized with sample data
3. ⏳ Update React frontend to use API endpoints (see REACT_FRONTEND_INTEGRATION.md)
4. ⏳ Test complete workflow with backend API
5. ⏳ Deploy to production

---

**XAMPP MySQL Tips:**
- Data is stored in `xampp\mysql\data\automall\`
- Reset data: Delete `automall` database and run `npm run migrate`
- View data: Use phpMyAdmin at http://localhost/phpmyadmin

