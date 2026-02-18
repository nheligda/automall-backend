# React Frontend API Integration Guide

This document explains how to update the React frontend to communicate with the Node.js/Express backend instead of using localStorage.

## Setup

### 1. Configure API Base URL

Create or update `react-ui/.env`:

```
VITE_API_URL=http://localhost:5000
```

### 2. Update DatabaseContext to Use API

The DatabaseContext needs to be refactored to make fetch calls instead of localStorage operations.

**Key changes needed:**
- Replace `localStorage.getItem()` with `fetch('/api/...')`
- Replace `localStorage.setItem()` with `fetch('/api/...', { method: 'POST/PUT' })`
- Add error handling and loading states
- Keep TypeScript types same, only change implementation

### 3. Update AuthContext to Use API

The AuthContext login/register functions should call the backend instead of checking localStorage.

**Changes needed:**
- `login()` → `POST /api/users/login`
- `register()` → `POST /api/users/register`
- Store JWT token or session instead of plain user object

## Example API Call Pattern

```typescript
// Before (localStorage):
const getInShowroomCars = () => {
  const db = JSON.parse(localStorage.getItem('automall_db') || '{}');
  return db.car_posts?.filter(c => c.Status === 'Verified') || [];
};

// After (API):
const getInShowroomCars = async () => {
  try {
    const response = await fetch(`${API_URL}/cars/status/verified`);
    if (!response.ok) throw new Error('Failed to fetch cars');
    return await response.json();
  } catch (error) {
    console.error('Error fetching verified cars:', error);
    return [];
  }
};
```

## Backend API Response Format

All API endpoints return consistent JSON responses:

### Success Response
```json
{
  "message": "Operation successful",
  "data": { /* entity object */ }
}
```

### Error Response
```json
{
  "message": "Error description",
  "error": "Detailed error"
}
```

## Implementation Priority

### Phase 1: Authentication (CRITICAL)
1. Update `AuthContext.tsx` login/register to use `/api/users/login` and `/api/users/register`
2. Store JWT token or user session
3. Test login/logout flow

### Phase 2: Car Operations (HIGH)
1. Update car listing methods to use `/api/cars/status/verified`
2. Update car creation to use `POST /api/cars`
3. Update car status changes to use `PUT /api/cars/:postId/status`

### Phase 3: Verification Workflow (HIGH)
1. Update inspection creation to use `POST /api/inspections`
2. Update approval flow to check showroom capacity

### Phase 4: Buyer Features (MEDIUM)
1. Update appointment booking to use `POST /api/appointments`
2. Update swap request creation to use `POST /api/swaps`

### Phase 5: Analytics (MEDIUM)
1. Update sales calculations to fetch from `/api/transactions`
2. Update appointment list from `/api/appointments`

### Phase 6: Sales Recording (LOW)
1. Update transaction creation to use `POST /api/transactions`
2. Ensure capacity tracking works with API

## Testing with Backend

1. **Start Backend**:
   ```bash
   cd backend
   npm run migrate
   npm start
   ```

2. **Start Frontend**:
   ```bash
   cd react-ui
   npm run dev
   ```

3. **Test User Workflows**:
   - Owner login
   - Staff verification
   - Seller submission
   - Buyer catalog viewing
   - Appointment booking
   - Sale recording

4. **Verify Database**:
   - Check phpMyAdmin http://localhost/phpmyadmin
   - View `automall` database tables
   - Confirm data is persisted across API calls

## API Error Handling Pattern

```typescript
try {
  const response = await fetch(`${API_URL}/api/endpoint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }

  const result = await response.json();
  return result; // May contain 'message' and 'data'
} catch (error) {
  console.error('API Error:', error);
  // Show user-friendly error message
  return null;
}
```

## State Management Updates

Current DatabaseContext provides methods like:
- `createCarPost(...)` - returns CarPost
- `getVerifiedCarPosts()` - returns CarPost[]
- `updateCarPostStatus(...)` - returns updated CarPost

These signatures stay the same, but implementations change to async/await:

```typescript
// Example refactored method
const createCarPost = async (
  sellerId: number,
  sellerName: string,
  details: Partial<CarPost>
): Promise<CarPost> => {
  try {
    const response = await fetch(`${API_URL}/api/cars`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sellerId,
        sellerName,
        make: details.Make,
        model: details.Model,
        year: details.Year,
        photos: details.Photos,
        expectedPrice: details.ExpectedPrice,
        color: details.Color,
        mileage: details.Mileage,
        condition: details.Condition,
        description: details.Description
      })
    });

    if (!response.ok) throw new Error('Failed to create car');
    const result = await response.json();
    return result.carPost;
  } catch (error) {
    console.error('Error creating car:', error);
    throw error;
  }
};
```

## Migration Checklist

- [ ] Configure `.env` with `VITE_API_URL`
- [ ] Update AuthContext login to use API
- [ ] Update AuthContext register to use API
- [ ] Update DatabaseContext car methods to use API
- [ ] Update DatabaseContext inspection methods to use API
- [ ] Update DatabaseContext appointment methods to use API
- [ ] Update DatabaseContext transaction methods to use API
- [ ] Update DatabaseContext swap methods to use API
- [ ] Add loading/error states to components
- [ ] Test complete user workflows
- [ ] Verify data persistence in MySQL
- [ ] Test capacity enforcement (max 60 cars)
- [ ] Test showroom full scenarios

## Common Patterns

### Fetch with Error Handling
```typescript
const fetchData = async (endpoint: string) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    return null;
  }
};
```

### Post Data
```typescript
const postData = async (endpoint: string, data: any) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Failed to post to ${endpoint}:`, error);
    return null;
  }
};
```

---

**Next Steps**: Begin Phase 1 implementation by updating AuthContext to use the backend API endpoints.
