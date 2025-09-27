# IoT Manufacturing Plant Control Center

A complete full-stack IoT monitoring and control system with **session-based authentication**, **advanced device management**, and **real-time search capabilities** for manufacturing plant environments. This system simulates hundreds of IoT devices monitoring energy consumption and safety parameters including current, temperature, and pressure.

## 🏗️ Architecture

```
├── simulator/          # Python device simulator (100+ IoT devices)
├── backend/            # Flask API with SQLite, authentication & analytics
└── frontend/           # React dashboard with authentication & search
```

## ✨ Key Features

### 🔐 **Authentication System**
- **Session-based authentication** with Flask-Login
- **Role-based access control** (Admin/Operator roles)
- **Secure password hashing** with bcrypt
- **Protected routes** with automatic session validation
- **User management** with login/logout functionality

### 🔍 **Advanced Search & Filtering**
- **Real-time device search** by device ID or type
- **Status-based filtering** (Warning, Critical, Turned Off, Optimal)
- **Combined search and filters** for precise device location
- **Smart search suggestions** with auto-complete
- **Clear filters** functionality for quick reset

### 🎛️ **Enhanced Device Control**
- **Turn Off functionality** with permanent state tracking
- **Device status management** with visual indicators
- **Bulk device operations** with multi-select
- **Real-time notifications** for control actions
- **Device details modal** with comprehensive statistics

### � **Modern Dashboard Interface**
- **Professional gradient themes** with glassmorphism effects
- **Responsive design** optimized for all screen sizes
- **Dark theme support** for reduced eye strain
- **Real-time updates** every 5 seconds
- **Interactive charts** and analytics visualization

### Device Simulator (Python)
- **Multi-device simulation**: Simulates 100+ IoT devices with realistic sensor data
- **Realistic data patterns**: Generates current (Amps), temperature (°C), and pressure (bar) readings
- **Device types**: Supports pumps, motors, heaters, compressors, conveyors, and sensor units
- **Failure simulation**: Random equipment failures and maintenance scenarios
- **Relay control**: Remote ON/OFF control simulation
- **Real-time communication**: RESTful API communication with backend

### Backend (Flask + Analytics + Authentication)
- **RESTful API**: Complete API for device management and data collection
- **Authentication system**: Session-based auth with user management
- **Database**: SQLite with optimized schema for time-series data and users
- **Real-time analytics**: Live data processing with Pandas/NumPy
- **Machine Learning**: 
  - Energy optimization recommendations (scikit-learn)
  - Anomaly detection (Isolation Forest)
  - Failure prediction algorithms
- **Alert system**: Threshold-based monitoring for temperature, pressure, and current
- **Device control**: Remote relay control and bulk operations
- **User management**: Secure user authentication and session handling

### Frontend (React Dashboard + Authentication)
- **Authentication UI**: Beautiful login page with form validation
- **Protected routes**: Access control for authenticated users only
- **Real-time monitoring**: Live device status with 5-second refresh
- **Advanced search**: Real-time device search with filters
- **Device management**: Enhanced control with turn-off functionality
- **Interactive charts**: Energy consumption, trends, and device analytics
- **Status filtering**: Filter devices by operational status
- **Modern UI**: Glassmorphism design with professional gradients
- **Responsive design**: Optimized for desktop, tablet, and mobile

## 📋 Prerequisites

### System Requirements
- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **Git** (for cloning)
- **4GB RAM** minimum (8GB recommended for 100+ devices)

### Network Requirements
- Port **5001** (Flask backend with authentication)
- Port **5173/5174** (Vite React frontend)

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd 01_CTRLFreaks
```

### 2. Backend Setup with Authentication

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv iot_env
source iot_env/bin/activate  # On Windows: iot_env\Scripts\activate

# Install dependencies (includes Flask-Login and bcrypt)
pip install -r requirements.txt

# Initialize database with authentication tables
python init_auth.py

# Start Flask server with authentication
python app.py
```

**✅ Backend Authentication Ready** - Server starts on `http://localhost:5001`

### 3. Frontend Setup with Authentication UI

```bash
# Navigate to frontend directory (in new terminal)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**✅ Frontend Ready** - Dashboard starts on `http://localhost:5173` (or 5174)

### 4. Device Simulator Setup

```bash
# Navigate to simulator directory (in new terminal)
cd simulator

# Install dependencies
pip install -r requirements.txt

# Start device simulation (default: 100 devices)
python device_simulator.py

# Or specify number of devices and update interval
python device_simulator.py --devices 50 --interval 3 --backend http://localhost:5001
```

## 🎯 Quick Start Guide

### 1. **Start the Complete System**

**Terminal 1 - Backend:**
```bash
cd backend && python app.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend && npm run dev
```

**Terminal 3 - Simulator:**
```bash
cd simulator && python device_simulator.py
```

### 2. **Access the System**

1. **Open Dashboard**: Navigate to `http://localhost:5173`
2. **Login Required**: You'll see the authentication login page
3. **Use Default Credentials**:
   - **Admin**: Username: `admin`, Password: `admin123`
   - **Operator**: Username: `operator`, Password: `operator123`

### 3. **Default User Accounts**

| Role | Username | Password | Permissions |
|------|----------|----------|-------------|
| Admin | `admin` | `admin123` | Full system access |
| Operator | `operator` | `operator123` | Device monitoring & control |

## 🚀 Dashboard Features

### 🔐 **Authentication Features**
- **Secure Login**: Session-based authentication with form validation
- **User Roles**: Admin and Operator role management  
- **Session Management**: Automatic session validation and logout
- **Protected Access**: All dashboard features require authentication

### 🔍 **Search & Filter System**
- **Device Search**: 
  - Click the 🔍 search icon next to filters
  - Search by device ID (e.g., "IOT_055") or device type (e.g., "pump")
  - Real-time results as you type
- **Status Filtering**: Filter by Warning, Critical, Turned Off, or All devices
- **Combined Search**: Use search and status filters together
- **Clear Filters**: One-click reset for all filters and search

### 🎛️ **Enhanced Device Control**
- **Turn Off Devices**: Permanently turn off devices with status tracking
- **Device Status Indicators**:
  - 🟢 **Optimal**: Normal operating conditions
  - 🟡 **Warning**: Elevated readings (Current >15A or Temp >30°C) 
  - 🔴 **Critical**: Dangerous levels (Current >20A or Temp >35°C)
  - ⚫ **Turned Off**: Manually disabled devices
- **Device Details**: Click "View Details" for comprehensive device statistics
- **Notifications**: Real-time feedback for all control actions

### 📊 **Analytics Dashboard**
- **Real-time Statistics**: Live system overview with device counts
- **Status Distribution**: Visual breakdown of device statuses
- **Performance Metrics**: Average current, temperature, and pressure readings
- **Trend Analysis**: Historical data analysis with predictive insights
- **Energy Monitoring**: Power consumption tracking and optimization

### 🖥️ **User Interface Features**
- **Modern Design**: Professional gradient theme with glassmorphism effects
- **Responsive Layout**: Optimized for desktop, tablet, and mobile devices
- **Real-time Updates**: Dashboard refreshes every 5 seconds automatically
- **Visual Feedback**: Loading states, notifications, and status indicators
- **Accessibility**: Keyboard navigation and screen reader support

## 🔧 API Endpoints

### Authentication Endpoints
- `POST /api/auth/login` - User login with session creation
- `POST /api/auth/logout` - User logout and session cleanup
- `GET /api/auth/check` - Verify authentication status
- `POST /api/auth/register` - Register new user (admin only)
- `GET /api/auth/me` - Get current user information

### Device Data Endpoints
- `GET /api/devices/status` - Get all device statuses with filtering
- `GET /api/latest-readings` - Get latest sensor readings
- `GET /api/device/{id}/readings` - Get specific device history
- `POST /api/sensor-data` - Receive sensor data from devices

### Analytics Endpoints
- `GET /api/analytics/overview` - System overview with statistics
- `GET /api/analytics/energy` - Energy consumption analysis
- `GET /api/analytics/alerts` - Current system alerts and warnings
- `GET /api/analytics/trends` - Historical trend analysis

### Control Endpoints
- `POST /api/device/{id}/control` - Send device control command
- `PUT /api/device/{id}/relay` - Toggle device relay state
- `POST /api/bulk-control` - Control multiple devices simultaneously
- `POST /api/emergency-stop` - Emergency stop all active devices

## ⚙️ Configuration & Customization

### 🔐 Authentication Configuration
**Default Users** (created automatically):
```python
# Admin account
Username: admin
Password: admin123
Role: admin

# Operator account  
Username: operator
Password: operator123
Role: operator
```

**Create New Users**:
```python
# In backend/init_auth.py, add:
User.create_user('new_user', 'user@company.com', 'secure_password', 'operator')
```

### 🎛️ Device Simulator Configuration
Edit `simulator/device_simulator.py` to modify:

**Number of Devices**:
```python
python device_simulator.py --devices 150  # Default: 100
```

**Update Frequency**:
```python
python device_simulator.py --interval 2   # Default: 3 seconds
```

**Device Types Distribution**:
- Update interval (default: 5 seconds)
- Device failure rates
- Sensor value ranges

### Backend Configuration
Edit `backend/app.py` for:
- Database settings
- Alert thresholds
- API rate limits
- CORS settings

### Frontend Configuration
Edit `frontend/src/services/api.ts` for:
- Backend URL (default: http://localhost:5000)
```python
DEVICE_TYPES = {
    'pump': 20,        # 20% pumps
    'motor': 15,       # 15% motors  
    'heater': 15,      # 15% heaters
    'compressor': 20,  # 20% compressors
    'conveyor': 20,    # 20% conveyors
    'sensor_unit': 10  # 10% sensors
}
```

**Failure Simulation**:
```python
python device_simulator.py --failure-rate 0.05  # 5% chance of failures
```

### 🎨 Frontend Customization

**Theme Configuration**:
```javascript
// In frontend/src/App.jsx
const GRADIENT_THEME = "from-gray-800 via-gray-700 to-slate-800"  // Current
// Change to:
const GRADIENT_THEME = "from-blue-900 via-indigo-900 to-purple-900"  // Blue theme
```

**Search & Filter Settings**:
```javascript
// In frontend/src/components/Dashboard.jsx
const SEARCH_PLACEHOLDER = "Search by device ID or type..."
const REFRESH_INTERVAL = 5000  // 5 seconds
```

### 🗄️ Database Configuration

**Authentication Tables**:
```sql
-- Users table (auto-created)
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash BLOB NOT NULL,
    role TEXT DEFAULT 'operator',
    is_active BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Advanced Customization

### Adding New Device Types
1. **Update Simulator** (`simulator/device_simulator.py`):
   ```python
   device_types = ["pump", "motor", "heater", "compressor", "conveyor", "sensor_unit", "new_type"]
   ```

2. **Update Backend Thresholds** (`backend/models/database.py`):
   ```python
   device_thresholds = {
       'new_type': {'current': (5, 25), 'temp': (20, 45), 'pressure': (1, 6)}
   }
   ```

### Custom Alert Thresholds
Edit device status logic in `frontend/src/components/Dashboard.jsx`:
```javascript
const getDeviceStatus = (device) => {
  const avgCurrent = device.avg_current || 0;
  const avgTemp = device.avg_temperature || 0;
  
  // Customize these values:
  if (avgCurrent > 20 || avgTemp > 35) return 'critical';
  if (avgCurrent > 15 || avgTemp > 30) return 'warning';
  return 'optimal';
};
```

### Adding New User Roles
1. **Backend** (`backend/models/auth.py`):
   ```python
   ALLOWED_ROLES = ['admin', 'operator', 'viewer', 'technician']
   ```

2. **Frontend Role Checks**:
   ```javascript
   const hasPermission = (user, action) => {
     const permissions = {
       admin: ['view', 'control', 'manage'],
       operator: ['view', 'control'],
       viewer: ['view']
     };
     return permissions[user.role]?.includes(action);
   };
   ```

## 📊 Data Structures

### Device Reading Schema
```json
{
  "device_id": "IOT_055",
  "timestamp": "2025-09-27T06:00:00Z",
  "current": 15.3,
  "temperature": 42.1,
  "pressure": 2.8,
  "relay_status": "ON",
  "device_type": "pump",
  "is_active": true,
  "maintenance_required": false
}
```

### Authentication Response Schema
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@iot.local",
    "role": "admin"
  },
  "message": "Login successful"
}
```

### Alert Schema
```json
{
  "device_id": "IOT_001",
  "alert_type": "high_temperature",
  "severity": "high",
  "message": "High temperature detected: 65.2°C",
  "value": 65.2,
  "threshold": 60.0,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## 🚨 Troubleshooting

### Common Issues

#### 1. **Backend Connection Failed**
- Check if Flask server is running on port 5000
- Verify Python virtual environment is activated
- Check for port conflicts: `netstat -an | grep 5000`

#### 2. **Frontend Not Loading**
- Ensure Node.js 16+ is installed
- Clear npm cache: `npm cache clean --force`
- Check for port conflicts on 3000

#### 3. **Simulator Not Sending Data**
- Verify backend is running and accessible
- Check simulator logs for connection errors
- Ensure correct backend URL in simulator arguments

#### 4. **Database Issues**
- Delete `backend/iot_data.db` and restart backend to recreate
- Run initialization scripts: `python init_db.py && python init_auth.py`

#### 5. **Authentication Problems**
```bash
# Reset admin password
cd backend
python -c "from models.auth import User; User.create_user('admin', 'admin@iot.local', 'newpassword', 'admin')"
```

#### 6. **Port Already in Use**
```bash
# Find and kill processes
lsof -ti:5001 | xargs kill -9  # Backend
lsof -ti:5173 | xargs kill -9  # Frontend
```

#### 7. **Search/Filter Not Working**
- Clear browser cache and cookies
- Check browser console for JavaScript errors
- Verify API endpoints are responding (Network tab)

### Performance Optimization

**Large Device Count (1000+ devices):**
```python
# In backend/models/database.py
BATCH_SIZE = 100
CACHE_DURATION = 30  # seconds
```

**Slow Frontend Loading:**
```javascript
// Reduce refresh frequency in Dashboard.jsx
const REFRESH_INTERVAL = 10000;  // 10 seconds instead of 5
```

### Development Tips

**Debug Mode:**
```bash
# Backend debug
export FLASK_DEBUG=1 && python app.py

# Frontend dev tools
npm run dev -- --host --debug
```

**Log Levels:**
```python
# In backend/app.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make changes and test thoroughly
4. Run tests: `npm test` (frontend) and `python -m pytest` (backend)
5. Commit changes: `git commit -m 'Add new feature'`
6. Push to branch: `git push origin feature/new-feature`
7. Create a Pull Request

### Code Style
- **Python**: Follow PEP 8, use Black formatter
- **JavaScript/React**: Use ESLint and Prettier
- **CSS**: Use TailwindCSS utilities, avoid custom CSS

### Testing
```bash
# Backend tests
cd backend && python -m pytest tests/

# Frontend tests  
cd frontend && npm test

# Integration tests
python scripts/run_integration_tests.py
```

## 🏗️ System Architecture

### Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   IoT Devices   │    │    Simulator    │    │     Backend     │
│   (Hardware)    │───▶│   Python API    │───▶│   Flask + DB    │
│                 │    │   Port 5002     │    │   Port 5001     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Browser     │◀───│    Frontend     │◀───│   REST API      │
│     Client      │    │  React + Vite   │    │   + Auth        │
│                 │    │  Port 5173      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow
1. **Simulator** generates realistic IoT sensor data
2. **Backend** receives and processes data, manages authentication
3. **Database** stores device readings and user sessions
4. **API** provides real-time data and control endpoints
5. **Frontend** displays data with search, filters, and controls
- Check database permissions in the backend directory
- Verify SQLite is properly installed

#### 5. **Missing Dependencies**
- Python: `pip install -r requirements.txt`
- Node.js: `npm install`
- Check Python version: `python --version`

### Performance Optimization

#### For Large Device Counts (500+ devices):
1. **Database Optimization**:
   ```python
   # Increase batch insert size in database.py
   BATCH_SIZE = 100
   ```

2. **Simulator Optimization**:
   ```python
   # Reduce update frequency
   python device_simulator.py --interval 10
   ```

3. **Frontend Optimization**:
   ```javascript
   // Increase refresh interval in App.tsx
   const interval = setInterval(fetchData, 10000); // 10 seconds
   ```

### Monitoring System Health

#### Backend Health Check:
```bash
curl http://localhost:5000/api/health
```

#### Database Statistics:
```bash
cd backend
python -c "
from models.database import *
import sqlite3
db = sqlite3.connect('iot_data.db')
print('Device count:', db.execute('SELECT COUNT(*) FROM device_status').fetchone()[0])
print('Total readings:', db.execute('SELECT COUNT(*) FROM sensor_readings').fetchone()[0])
"
```

## 🔒 Security Considerations

### Production Deployment
1. **Environment Variables**: Use environment variables for sensitive config
2. **Database Security**: Use PostgreSQL/MySQL instead of SQLite
3. **API Authentication**: Implement JWT or API key authentication
4. **HTTPS**: Enable SSL/TLS for all communications
5. **Input Validation**: Add comprehensive input validation
6. **Rate Limiting**: Implement API rate limiting

### Development Security
- Never commit sensitive data to version control
- Use virtual environments for Python dependencies
- Keep dependencies updated: `npm audit fix`

## 📈 Scaling

### Horizontal Scaling
- **Load Balancer**: Use nginx for multiple backend instances
- **Database**: Migrate to PostgreSQL with read replicas
- **Message Queue**: Implement Redis/RabbitMQ for device communication
- **Containerization**: Use Docker for consistent deployments

### Vertical Scaling
- **Database Indexing**: Add indexes for frequently queried columns
- **Caching**: Implement Redis for analytics caching  
- **Background Jobs**: Use Celery for heavy analytics processing

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with:
   - System information (OS, Python/Node versions)
   - Error messages and logs
   - Steps to reproduce the issue

## 📋 Technical Specifications

- **Backend**: Flask 2.3+, SQLite, Flask-Login 0.6.3, bcrypt 5.0.0
- **Frontend**: React 18+, Vite 5+, TailwindCSS v4, React Router v6
- **Simulator**: Python 3.8+, asyncio, threading, requests
- **Database**: SQLite with optimized indexes for time-series and auth data
- **Authentication**: Session-based with Flask-Login, bcrypt password hashing
- **Real-time**: HTTP polling (5-second intervals) with search optimization
- **UI Framework**: TailwindCSS utility-first with glassmorphism design
- **Charts**: Modern dashboard with responsive design and status indicators

## 🔮 Future Enhancements

- **WebSocket Integration**: Real-time bidirectional communication
- **Mobile App**: React Native companion app
- **Advanced ML**: Predictive maintenance algorithms
- **Cloud Integration**: AWS/Azure IoT Hub connectivity
- **Multi-tenant Support**: Organization-based access control
- **Advanced Analytics**: Time-series forecasting and optimization
- **Export Features**: PDF reports and CSV data export
- **Notification System**: Email/SMS alerts for critical events

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments
- Flask community for excellent web framework and authentication extensions
- React team for powerful UI library and ecosystem  
- TailwindCSS for utility-first styling framework
- SQLite team for embedded database excellence
- Open source contributors and testers

---
*Built with ❤️ for Industrial IoT Control Centers*

**Ready for Production** • **Secure Authentication** • **Real-time Control** • **Professional UI**