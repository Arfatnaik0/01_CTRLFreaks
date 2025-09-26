# IoT Energy Monitor - Quick Setup

## Prerequisites
- Node.js 16+ ([Download](https://nodejs.org/))
- Docker Desktop ([Download](https://docker.com/products/docker-desktop))
- Git ([Download](https://git-scm.com/))

## Installation (5 minutes)

```bash
# 1. Clone repository
git clone https://github.com/Arfatnaik0/01_CTRLFreaks.git
cd 01_CTRLFreaks

# 2. Start backend (Docker)
cd backend
docker-compose up -d
cd ..

# 3. Start frontend
cd frontend
npm install
npm run dev
```

## Access Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Key Dependencies (Auto-installed)
- **React 18.2.0** - UI framework
- **Chart.js 4.5.0** - Data visualization
- **React-ChartJS-2 5.3.0** - React wrapper for Chart.js
- **Tailwind CSS 4.1.13** - Styling framework
- **Vite 7.1.7** - Build tool and dev server

## Features
✅ Real-time IoT device monitoring  
✅ AI anomaly detection  
✅ Predictive maintenance  
✅ Interactive charts & analytics  
✅ 4-tab dashboard navigation  
✅ Professional dark theme  
✅ Auto-refresh every 30s  

## Troubleshooting
- **Port conflicts**: Backend uses 5000, frontend uses 5173
- **Docker issues**: Ensure Docker Desktop is running
- **Node version**: Requires Node.js 16 or higher

For detailed setup instructions, see `SETUP_INSTRUCTIONS.txt`