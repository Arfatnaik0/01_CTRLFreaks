# IoT Smart Energy Consumption and Safety Monitor

## Project Structure

```
01_CTRLFreaks/
├── docker-compose.yml          # Container orchestration
├── .env.example               # Environment variables template
├── frontend/                  # React + Tailwind dashboard
│   ├── src/
│   ├── package.json
│   └── ...
├── backend/                   # Legacy Node.js (if needed)
├── iot-system/               # Python microservices
│   ├── flask-api/            # Main REST API
│   ├── sensor-simulator/     # IoT device simulator
│   ├── data-processor/       # Stream data processor
│   ├── ml-engine/           # Machine learning models
│   └── control-system/      # Device control simulation
├── database/                 # Database initialization
│   └── init.sql
└── docker/                   # Docker configurations
    └── grafana/
```

## Quick Start

1. **Environment Setup**
   ```bash
   cp .env.example .env
   ```

2. **Start Services**
   ```bash
   docker-compose up -d
   ```

3. **Verify Services**
   - Kafka: http://localhost:9092
   - PostgreSQL: localhost:5432
   - Flask API: http://localhost:5000
   - React Frontend: http://localhost:3000
   - Grafana: http://localhost:3001 (admin/admin)

## Services Overview

### Core Infrastructure
- **Kafka**: Message streaming for real-time data
- **PostgreSQL**: Time-series and relational data storage
- **Redis**: Caching and session storage
- **Grafana**: Advanced data visualization

### Application Services
- **Flask API**: REST API for frontend communication
- **Sensor Simulator**: Generates realistic IoT sensor data
- **Data Processor**: Processes streaming sensor data
- **ML Engine**: Machine learning for predictions and optimization
- **Control System**: Simulates device control capabilities

## Development Workflow

1. **Phase 1**: Foundation Setup ✓
2. **Phase 2**: Data Simulation & Streaming
3. **Phase 3**: Real-time Analytics & ML
4. **Phase 4**: Control Layer Implementation
5. **Phase 5**: Frontend Dashboard
6. **Phase 6**: Advanced Features & Integration

## API Endpoints

### Device Management
- `GET /api/devices` - List all devices
- `GET /api/devices/{id}` - Get device details
- `POST /api/devices/{id}/control` - Control device

### Data & Analytics
- `GET /api/devices/{id}/sensor-data` - Get sensor readings
- `GET /api/alerts` - Get system alerts
- `GET /api/dashboard/stats` - Dashboard statistics

### Health & Monitoring
- `GET /api/health` - Service health check

## Data Models

### Sensor Data Schema
```json
{
  "device_id": "MOTOR_001",
  "timestamp": "2025-09-26T10:30:00Z",
  "current_value": 12.5,
  "temperature": 68.2,
  "pressure": 8.1,
  "energy_consumption": 3.2,
  "status": "normal"
}
```

## Technology Stack

- **Frontend**: React 19, Tailwind CSS 4, Vite
- **Backend**: Python Flask, SQLAlchemy
- **Streaming**: Apache Kafka
- **Database**: PostgreSQL, Redis
- **ML**: scikit-learn, pandas, NumPy
- **Visualization**: Grafana, Chart.js
- **Containerization**: Docker, Docker Compose

## Next Steps

After foundation setup:
1. Start sensor data simulation
2. Implement real-time data processing
3. Build ML models for prediction
4. Create React dashboard components
5. Add device control capabilities
6. Integrate Grafana dashboards