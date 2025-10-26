# Deployment Guide for Render

## Backend Changes Made

### 1. Fixed Database Configuration
- Changed from in-memory database to persistent file-based SQLite database
- This ensures user registrations and data persist across deployments
- The database file will be stored in Render's persistent disk storage

### 2. Fixed User Authentication
- Users can now register and login properly
- Default admin user is created on first run:
  - Username: `admin`
  - Password: `admin123`

### 3. Fixed API Endpoints
- All authentication endpoints are working correctly
- CORS is properly configured for production

## Frontend Changes Made

### 1. Fixed Authentication
- Updated `AuthContext.jsx` to use the correct production API URL
- Fixed the auth check endpoint to use environment variables

### 2. Enhanced Empty State
- When no devices are connected, a friendly empty state message is displayed
- Clear instructions for users on how to start the simulator
- No more confusing dummy data when simulator is off

### 3. Improved User Experience
- Better error messages for authentication failures
- Clearer device status indicators
- Search and filter functionality preserved

## Deployment Steps

### Backend Deployment on Render

1. **Environment Variables** (if not already set):
   ```
   FLASK_ENV=production
   SECRET_KEY=your-secret-key-here
   DATABASE_URL=iot_data.db
   ```

2. **Add Persistent Disk** (Important for database):
   - Go to your backend service on Render
   - Navigate to "Disks" tab
   - Add a new disk with:
     - Name: `iot-database`
     - Mount Path: `/opt/render/project/src/data`
     - Size: 1 GB (minimum)
   - Update `DATABASE_URL` to: `/opt/render/project/src/data/iot_data.db`

3. **Redeploy**:
   - Push these changes to your repository
   - Render will automatically detect and deploy
   - Or manually trigger a deploy from Render dashboard

### Frontend Deployment on Render

1. **Environment Variables**:
   ```
   VITE_API_URL=https://iot-dashboard-09py.onrender.com/api
   ```

2. **Redeploy**:
   - Push the changes to your repository
   - Render will automatically rebuild and deploy

## Testing the Changes

### 1. Test User Registration
```bash
curl -X POST https://iot-dashboard-09py.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpass123"
  }'
```

### 2. Test Login
```bash
curl -X POST https://iot-dashboard-09py.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

### 3. Test Empty Dashboard
1. Open: https://iot-frontend-gmny.onrender.com/
2. Login with admin credentials
3. You should see a clean empty state with instructions
4. No dummy data should be displayed

### 4. Test with Simulator
1. Run the device simulator from your local machine:
   ```powershell
   cd simulator
   python device_simulator.py
   ```
2. Dashboard should populate with real-time data
3. Device cards should appear and update automatically

## Default Credentials

- **Username**: `admin`
- **Password**: `admin123`

**Important**: Change the admin password after first login!

## Troubleshooting

### Users Not Being Created
- Verify persistent disk is properly mounted
- Check Render logs for database initialization messages
- Ensure bcrypt is installed in requirements.txt

### Empty State Not Showing
- Clear browser cache
- Check browser console for errors
- Verify frontend environment variables are set

### Authentication Failing
- Check that cookies are enabled in browser
- Verify CORS settings in backend
- Check that API_URL is correct in frontend

## Files Modified

### Backend
- `backend/app.py` - Database configuration
- `backend/models/database.py` - Database initialization and persistence
- `backend/models/auth.py` - User authentication (no changes needed)
- `backend/routes/auth_routes.py` - Authentication routes (no changes needed)

### Frontend
- `frontend/src/contexts/AuthContext.jsx` - Fixed API URL
- `frontend/src/components/Dashboard.jsx` - Added empty state
- `frontend/src/services/api.js` - No changes needed

## Next Steps

1. Deploy backend with persistent disk
2. Deploy frontend with correct environment variables
3. Test authentication flow
4. Test empty state display
5. Run simulator to verify data flow
6. Change default admin password

## Support

If you encounter any issues:
1. Check Render deployment logs
2. Verify environment variables
3. Test API endpoints directly with curl
4. Check browser console for frontend errors
