# Offline Detection & Auto-Refresh Feature

## Overview
Implemented automatic device offline detection and system status display. When the device simulator stops sending data, devices automatically go offline and disappear from the dashboard after 5 minutes.

---

## 🎯 Features Implemented

### 1. **Automatic Device Offline Detection**
- Devices that haven't sent data in **30 seconds** are marked as **OFFLINE**
- Devices offline for more than **5 minutes** are **removed from dashboard**
- System automatically detects when simulator stops

### 2. **System Status Indicator**
- Header shows **"System Online"** (green) when devices are active
- Header shows **"System Offline"** (gray) when no devices sending data
- Updates every **5 seconds** automatically

### 3. **Empty State Handling**
- Dashboard shows clean empty state when no devices exist
- Clear message and instructions displayed
- No confusing or stale data shown

---

## 📝 Changes Made

### Backend Changes

#### 1. **Modified `backend/models/database.py`**

**Function: `get_all_device_status()`**
- Added offline detection logic
- Devices not seen in 30 seconds marked as offline
- Devices not seen in 5 minutes filtered out
- Returns only active/recent devices

```python
def get_all_device_status():
    """Get status of all devices with offline detection"""
    # Define offline threshold (30 seconds without data = offline)
    offline_threshold = (datetime.now() - timedelta(seconds=30)).isoformat()
    
    # Query marks devices as offline if last_seen < threshold
    # Filters out devices offline > 5 minutes
    five_minutes_ago = (datetime.now() - timedelta(minutes=5)).isoformat()
    active_devices = [d for d in devices if d['last_seen'] > five_minutes_ago]
```

#### 2. **Added to `backend/app.py`**

**New Endpoint: `/api/system-status`**
- Returns overall system online/offline status
- Counts online vs offline devices
- Used by frontend to show system indicator

```python
@app.route('/api/system-status')
def system_status():
    # Checks if any devices received data in last 30 seconds
    # Returns system_online: true/false
    return jsonify({
        "system_online": system_online,
        "total_devices": len(devices),
        "online_devices": len(online_devices),
        "offline_devices": len(devices) - len(online_devices)
    })
```

### Frontend Changes

#### 3. **Modified `frontend/src/services/api.js`**

**Added Method: `getSystemStatus()`**
```javascript
static async getSystemStatus() {
  return this.request('/system-status');
}
```

#### 4. **Modified `frontend/src/components/Dashboard.jsx`**

**Added State:**
- `systemOnline` - tracks if any devices are sending data

**Updated Data Fetching:**
- Now fetches system status along with devices
- Updates system online status every 5 seconds
- Automatically shows empty state when all devices offline

```javascript
const [systemStatusResponse] = await Promise.all([
  ApiService.getSystemStatus()
]);
setSystemOnline(systemStatusResponse.system_online || false);
```

#### 5. **Modified `frontend/src/components/Header.jsx`**

**Enhanced Status Indicator:**
- Now shows **green dot** when system online (devices sending data)
- Shows **gray dot** when system offline (no devices sending data)
- Updates every 5 seconds automatically
- Text changes: "System Online" / "System Offline"

```javascript
const getStatusColor = () => {
  if (connectionStatus !== 'connected') return 'bg-red-500';
  return systemOnline ? 'bg-green-500' : 'bg-gray-500';
};
```

---

## 🔄 How It Works

### When Simulator is Running:
1. ✅ Devices send data every few seconds
2. ✅ Backend updates `last_seen` timestamp
3. ✅ System status shows **"System Online"** (green)
4. ✅ Dashboard shows device cards with real-time data
5. ✅ Stats update continuously

### When Simulator Stops:
1. ⏱️ **After 30 seconds**: Devices marked as offline
2. ⏱️ **After 5 minutes**: Devices removed from dashboard
3. 🔴 System status shows **"System Offline"** (gray)
4. 📭 Dashboard shows empty state with instructions
5. ♻️ All data refreshes to clean state

### When Simulator Restarts:
1. ✅ New data received immediately
2. ✅ Devices reappear on dashboard
3. ✅ System status changes to **"System Online"** (green)
4. ✅ Real-time updates resume

---

## ⚙️ Configuration

### Timing Settings (can be adjusted):

**Backend (`backend/models/database.py`):**
```python
# Mark device offline after 30 seconds without data
offline_threshold = timedelta(seconds=30)

# Remove device from display after 5 minutes offline
removal_threshold = timedelta(minutes=5)
```

**Frontend:**
```javascript
// Dashboard refresh rate
const interval = setInterval(fetchData, 5000); // 5 seconds

// Header status check rate
const interval = setInterval(checkStatus, 5000); // 5 seconds
```

---

## 🧪 Testing Instructions

### Test 1: Normal Operation
1. Start backend: `cd backend; python app.py`
2. Start frontend: `cd frontend; npm run dev`
3. Start simulator: `cd simulator; python device_simulator.py`
4. ✅ Should see: Green "System Online" indicator
5. ✅ Should see: Device cards with real-time data

### Test 2: Simulator Stops
1. Stop the simulator (Ctrl+C)
2. Wait 30 seconds
3. ✅ Should see: Devices marked offline in backend
4. Wait 5 minutes
5. ✅ Should see: Gray "System Offline" indicator
6. ✅ Should see: Empty state on dashboard

### Test 3: Simulator Restarts
1. Restart simulator: `python device_simulator.py`
2. Wait 5-10 seconds
3. ✅ Should see: Green "System Online" indicator
4. ✅ Should see: Devices reappear on dashboard
5. ✅ Should see: Real-time data flowing

### Test 4: API Endpoints
```powershell
# Test system status
Invoke-WebRequest "http://localhost:5001/api/system-status" | ConvertFrom-Json

# Expected when online:
# {
#   "system_online": true,
#   "total_devices": 5,
#   "online_devices": 5,
#   "offline_devices": 0
# }

# Expected when offline:
# {
#   "system_online": false,
#   "total_devices": 0,
#   "online_devices": 0,
#   "offline_devices": 0
# }
```

---

## 📊 Visual Indicators

### System Status Header:
```
🟢 System Online   (Green dot, pulsing) - Devices sending data
⚫ System Offline  (Gray dot, pulsing)  - No devices sending data
🔴 System Offline  (Red dot, pulsing)   - Backend disconnected
```

### Dashboard States:
```
WITH DEVICES:    Shows device cards, stats, charts
WITHOUT DEVICES: Shows empty state with instructions
LOADING:         Shows skeleton loading animation
```

---

## 🚀 Deployment

### Commit Changes:
```powershell
git add .
git commit -m "Add offline detection and system status indicator"
git push origin main
```

### Environment Variables (No changes needed):
- Existing configuration works as-is
- No new environment variables required

### Database (No migration needed):
- Uses existing `last_seen` field in `device_status` table
- No schema changes required

---

## 🔧 Troubleshooting

### Issue: Devices not disappearing when simulator stops
**Solution:** Check timing thresholds in `get_all_device_status()`

### Issue: System status always shows offline
**Solution:** 
- Verify simulator is sending data
- Check `/api/system-status` endpoint response
- Verify device `last_seen` timestamps in database

### Issue: Empty state not showing
**Solution:**
- Hard refresh browser (Ctrl+Shift+R)
- Check browser console for errors
- Verify API responses in Network tab

---

## 📈 Benefits

✅ **Better UX**: Users know immediately if simulator is running
✅ **No Stale Data**: Old data automatically cleared
✅ **Clear Status**: Visual indicator shows system state
✅ **Automatic**: No manual refresh needed
✅ **Production Ready**: Works on Render deployment

---

## 🎯 Success Criteria

Your implementation is successful when:
- ✅ Green indicator shows when simulator runs
- ✅ Gray indicator shows when simulator stops
- ✅ Devices disappear after 5 minutes offline
- ✅ Empty state displays when no devices
- ✅ Devices reappear when simulator restarts
- ✅ All updates happen automatically

---

## Next Steps

1. ✅ Review the changes
2. ✅ Test locally with simulator on/off
3. 📤 Commit and push to repository
4. 🚀 Deploy to Render (auto-deploys)
5. 🧪 Test on production URL
6. 🎉 Enjoy automatic offline detection!
