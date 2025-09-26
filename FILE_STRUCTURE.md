# IoT Energy Monitor - File Structure Documentation

This document provides a comprehensive overview of the project's file structure, explaining the purpose and functionality of each directory and key files.

## 📁 Project Root Structure

```
01_CTRLFreaks/
├── 📁 backend/                    # Node.js Backend Server
├── 📁 frontend/                   # React Frontend Application
├── 📁 iot-system/                 # Microservices Architecture
├── 📁 database/                   # Database Schema & Scripts
├── 📁 docker/                     # Docker Configuration Files
├── 📄 docker-compose.yml          # Main Container Orchestration
├── 📄 .env                        # Environment Variables (local)
├── 📄 .env.example                # Environment Variables Template
├── 📄 start.sh                    # Quick Start Script
├── 📄 SETUP_INSTRUCTIONS.txt      # Detailed Setup Guide
├── 📄 QUICK_START.md              # Quick Start Guide
├── 📄 README.md                   # Project Overview
└── 📄 .gitignore                  # Git Ignore Rules
```

---

## 🖥️ Frontend Directory (`/frontend/`)

### **Technology Stack**: React 18.2.0 + Vite 7.1.7 + Tailwind CSS 4.1.13 + Chart.js 4.5.0

```
frontend/
├── 📁 src/
│   ├── 📄 App.jsx                 # Main Application Component (4-Tab Dashboard)
│   ├── 📄 App.css                 # Application Styles
│   ├── 📄 main.jsx                # React Entry Point
│   ├── 📄 index.css               # Global CSS & Tailwind Imports
│   │
│   ├── 📁 components/             # Reusable React Components
│   │   ├── 📄 AlertPanel.jsx           # Alert Display Component
│   │   ├── 📄 DeviceGrid.jsx           # Device List Component
│   │   ├── 📄 ControlPanel.jsx         # Control Interface
│   │   ├── 📄 EnergyChart.jsx          # Energy Visualization
│   │   ├── 📄 SystemMetrics.jsx        # Basic Metrics Display
│   │   ├── 📄 EnhancedSystemMetrics.jsx # Advanced Metrics
│   │   ├── 📄 MLAnalytics.jsx          # ML Analytics Components
│   │   ├── 📄 MLEnhancedAlertPanel.jsx # AI-Enhanced Alerts
│   │   └── 📄 MLEnhancedDeviceGrid.jsx # AI-Enhanced Device Grid
│   │
│   └── 📁 backup-files/           # Component Version History
│       ├── 📄 App_old.jsx              # Previous App Version
│       ├── 📄 App_backup.jsx           # Backup App Version
│       ├── 📄 App_working.jsx          # Working App Version
│       ├── 📄 App.jsx.backup           # JSX Backup
│       └── 📄 SimpleApp.jsx            # Minimal App Version
│
├── 📄 index.html                  # HTML Entry Point
├── 📄 package.json                # Dependencies & Scripts
├── 📄 package-lock.json           # Dependency Lock File
├── 📄 vite.config.js              # Vite Build Configuration
├── 📄 tailwind.config.js          # Tailwind CSS Configuration
├── 📄 eslint.config.js            # ESLint Code Quality Rules
├── 📄 test.html                   # Testing HTML File
├── 📄 README.md                   # Frontend Documentation
└── 📄 .gitignore                  # Frontend Git Ignore
```

### **Key Features**:
- **4-Tab Navigation**: Overview, Analytics, Forecasting, Performance
- **Real-time Data**: 30-second auto-refresh with API failover
- **Chart.js Integration**: Line, Bar, and Doughnut visualizations
- **Responsive Design**: Mobile-first Tailwind CSS implementation
- **Mock Data Generation**: Fallback for API failures

---

## 🔧 Backend Directory (`/backend/`)

### **Technology Stack**: Node.js + Express.js + Python ML Integration

```
backend/
├── 📄 server.js                   # Main Express.js Server
├── 📄 ml_api.py                   # Python ML API Bridge
├── 📄 ml_analyzer.py              # Advanced ML Analytics Engine (372 lines)
├── 📄 ml_requirements.txt         # Python Dependencies
├── 📄 ml_analytics_report.json    # ML Analysis Results
└── 📄 server.log                  # Server Activity Logs
```

### **Core Functionality**:
- **REST API Endpoints**: `/api/devices`, `/api/alerts`, `/api/ml/*`
- **ML Integration**: scikit-learn 1.3.0 based analytics
- **Real-time Processing**: Live data streaming and analysis
- **Anomaly Detection**: Isolation Forest ML algorithms

---

## 🏭 IoT System Directory (`/iot-system/`)

### **Microservices Architecture**: Docker-based containerized services

```
iot-system/
├── 📁 sensor-simulator/           # IoT Sensor Data Generator
│   ├── 📄 sensor_simulator.py         # Sensor Data Simulation
│   ├── 📄 requirements.txt            # Python Dependencies
│   └── 📄 Dockerfile                  # Container Configuration
│
├── 📁 data-processor/             # Real-time Data Processing
│   ├── 📄 data_processor.py           # Stream Processing Engine
│   ├── 📄 requirements.txt            # Python Dependencies
│   └── 📄 Dockerfile                  # Container Configuration
│
├── 📁 ml-engine/                  # Machine Learning Pipeline
│   ├── 📄 ml_engine.py                # ML Model Training & Inference
│   ├── 📄 requirements.txt            # Python Dependencies
│   └── 📄 Dockerfile                  # Container Configuration
│
├── 📁 flask-api/                  # Flask REST API Service
│   ├── 📄 app.py                      # Flask Application
│   ├── 📄 ml_analyzer.py              # ML Analysis Integration
│   ├── 📄 requirements.txt            # Python Dependencies
│   └── 📄 Dockerfile                  # Container Configuration
│
└── 📁 control-system/             # Device Control Management
    ├── 📄 control_system.py           # Device Control Logic
    ├── 📄 requirements.txt            # Python Dependencies
    └── 📄 Dockerfile                  # Container Configuration
```

### **Service Architecture**:
- **Sensor Simulator**: Generates realistic IoT sensor data
- **Data Processor**: Real-time stream processing with anomaly detection
- **ML Engine**: Advanced analytics and predictive maintenance
- **Flask API**: RESTful web services for data access
- **Control System**: Device management and automation

---

## 🗄️ Database Directory (`/database/`)

### **PostgreSQL Schema & Data Management**

```
database/
├── 📄 enhanced_schema.sql         # Complete Database Schema
├── 📄 create-table.sql            # Basic Table Creation
├── 📄 populate_devices.sql        # Device Data Population
└── 📄 add_missing_devices.sql     # Additional Device Records
```

### **Database Structure**:
- **Devices Table**: IoT device registry and status
- **Sensor Data**: Time-series energy consumption data
- **Alerts**: Alert management and categorization
- **ML Results**: Machine learning analysis storage

---

