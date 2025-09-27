# IoT Manufacturing Plant Monitoring System

A complete full-stack IoT simulation system for monitoring and controlling manufacturing plant devices. This system simulates hundreds of IoT devices monitoring energy consumption and safety parameters including current, temperature, and pressure.

## 🏗️ Architecture

```
├── simulator/          # Python device simulator (100+ IoT devices)
├── backend/            # Flask API with SQLite, Pandas & ML analytics
└── frontend/           # React + TailwindCSS dashboard
```

## 🚀 Features

### Device Simulator (Python)
- **Multi-device simulation**: Simulates 100+ IoT devices with realistic sensor data
- **Realistic data patterns**: Generates current (Amps), temperature (°C), and pressure (bar) readings
- **Device types**: Supports pumps, motors, heaters, compressors, conveyors, and sensor units
- **Failure simulation**: Random equipment failures and maintenance scenarios
- **Relay control**: Remote ON/OFF control simulation
- **Real-time communication**: RESTful API communication with backend

### Backend (Flask + Analytics)
- **RESTful API**: Complete API for device management and data collection
- **Database**: SQLite with optimized schema for time-series data
- **Real-time analytics**: Live data processing with Pandas/NumPy
- **Machine Learning**: 
  - Energy optimization recommendations (scikit-learn)
  - Anomaly detection (Isolation Forest)
  - Failure prediction algorithms
- **Alert system**: Threshold-based monitoring for temperature, pressure, and current
- **Device control**: Remote relay control and bulk operations

### Frontend (React Dashboard)
- **Real-time monitoring**: Live device status with 5-second refresh
- **Interactive charts**: Energy consumption, trends, and device analytics (Recharts)
- **Device control**: Individual and bulk device relay control
- **Alert management**: Visual alert panel with severity levels
- **Responsive design**: Works on desktop and mobile (TailwindCSS)
- **Modern UI**: Clean, professional interface with dark mode support

## 📋 Prerequisites

### System Requirements
- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **Git** (for cloning)
- **4GB RAM** minimum (8GB recommended for 100+ devices)

### Network Requirements
- Port **5001** (Flask backend)
- Port **3000** (React frontend)

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd 01_CTRLFreaks
git checkout t1
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv iot_env
source iot_env/bin/activate  # On Windows: iot_env\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python -c "from models.database import init_db; init_db()"

# Start Flask server
python app.py
```

The backend will start on `http://localhost:5001`

### 3. Frontend Setup

```bash
# Navigate to frontend directory (in new terminal)
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

The frontend will start on `http://localhost:3000`

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

## 🎯 Usage Guide

### Starting the Full System

1. **Start Backend** (Terminal 1):
   ```bash
   cd backend && python app.py
   ```

2. **Start Frontend** (Terminal 2):
   ```bash
   cd frontend && npm start
   ```

3. **Start Simulator** (Terminal 3):
   ```bash
   cd simulator && python device_simulator.py
   ```

4. **Access Dashboard**: Open `http://localhost:3000`

### Dashboard Features

#### 1. **Live Device Monitoring**
- View all devices in real-time table
- Monitor current, temperature, pressure readings
- Check device status and relay positions
- Select devices for bulk operations

#### 2. **Analytics & Charts**
- **Energy Consumption**: Hourly usage patterns
- **Trends Analysis**: Historical trend analysis with ML
- **Device Distribution**: Energy usage by device type
- **Peak Values**: Maximum readings tracking

#### 3. **Alert Management**
- **Severity Levels**: High, Medium, Low alerts
- **Alert Types**: Temperature, pressure, current, maintenance
- **Auto-dismiss**: Configurable alert dismissal
- **Real-time Updates**: Live alert monitoring

#### 4. **Device Control**
- **Individual Control**: Turn devices ON/OFF
- **Bulk Operations**: Control multiple devices
- **Emergency Stop**: Immediate shutdown of all devices
- **Maintenance Mode**: Set devices for maintenance

### API Endpoints

#### Device Data
- `GET /api/devices/status` - Get all device statuses
- `GET /api/latest-readings` - Get latest sensor readings
- `GET /api/device/{id}/readings` - Get specific device history

#### Analytics
- `GET /api/analytics/overview` - System overview
- `GET /api/analytics/energy` - Energy consumption analysis
- `GET /api/analytics/alerts` - Current system alerts
- `GET /api/analytics/trends` - Trend analysis

#### Control
- `POST /api/device/{id}/control` - Send device command
- `PUT /api/device/{id}/relay` - Toggle device relay
- `POST /api/bulk-control` - Control multiple devices
- `POST /api/emergency-stop` - Emergency stop all devices

## ⚙️ Configuration

### Simulator Configuration
Edit `simulator/device_simulator.py` to modify:
- Number of devices (default: 100)
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
- Refresh intervals
- Chart configurations

## 🔧 Customization

### Adding New Device Types
1. Update `simulator/device_simulator.py`:
   ```python
   device_types = ["pump", "motor", "heater", "compressor", "conveyor", "sensor_unit", "new_type"]
   ```

2. Update thresholds in `backend/analytics/data_analyzer.py`:
   ```python
   expected_ranges = {
       'new_type': (min_current, max_current)
   }
   ```

### Custom Alert Thresholds
Edit `backend/analytics/data_analyzer.py`:
```python
self.thresholds = {
    'high_current': 30.0,      # Amps
    'high_temperature': 60.0,   # Celsius
    'high_pressure': 7.0,       # bar
    'low_pressure': 0.5,        # bar
}
```

### Frontend Styling
- Modify `frontend/tailwind.config.js` for colors and themes
- Edit component files in `frontend/src/components/` for layout changes
- Update `frontend/src/index.css` for global styles

## 📊 Data Structure

### Device Reading Schema
```json
{
  "device_id": "IOT_001",
  "timestamp": "2024-01-01T12:00:00Z",
  "current": 15.3,
  "temperature": 42.1,
  "pressure": 2.8,
  "relay_status": "ON",
  "device_type": "pump",
  "is_active": true,
  "maintenance_required": false
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

- **Backend**: Flask 2.3+, SQLite, Pandas 2.0+, scikit-learn 1.3+
- **Frontend**: React 18+, TypeScript, TailwindCSS 3.3+, Recharts
- **Simulator**: Python 3.8+, asyncio, threading
- **Database**: SQLite with optimized indexes
- **Real-time**: HTTP polling (5-second intervals)
- **Charts**: Recharts with responsive design
- **Styling**: TailwindCSS utility-first framework