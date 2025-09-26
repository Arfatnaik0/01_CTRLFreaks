import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [data, setData] = useState({
    devices: [],
    alerts: [],
    anomalies: [],
    maintenancePredictions: [],
    stats: { total_devices: 0, active_alerts: 0 },
    maintenance: 0,
    loading: true
  });

  // Filter anomalies to last 24 hours only
  const filterLast24Hours = (anomalies) => {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return anomalies.filter(anomaly => 
      new Date(anomaly.timestamp) > last24Hours
    );
  };

  const fetchData = async () => {
    try {
      const API_BASE = 'http://localhost:5000/api';
      
      const [devices, alerts, stats, anomalies, maintenance] = await Promise.all([
        fetch(`${API_BASE}/devices`).then(r => r.json()),
        fetch(`${API_BASE}/alerts`).then(r => r.json()),
        fetch(`${API_BASE}/system-stats`).then(r => r.json()),
        fetch(`${API_BASE}/ml/anomalies`).then(r => r.json()),
        fetch(`${API_BASE}/ml/maintenance`).then(r => r.json())
      ]);

      // Filter anomalies to last 24 hours
      const recent_anomalies = filterLast24Hours(anomalies.anomalies || []);

      setData({
        devices: devices || [],
        alerts: alerts || [],
        anomalies: recent_anomalies,
        maintenancePredictions: maintenance.predictions || [],
        stats: stats || { total_devices: 0, active_alerts: 0 },
        maintenance: maintenance.count || 0,
        loading: false
      });

    } catch (error) {
      console.error('API Error:', error);
      // Fallback demo data
      setData({
        devices: [
          { device_id: 'MOTOR_001', location: 'Production A', status: 'active' },
          { device_id: 'PUMP_002', location: 'Cooling System', status: 'active' }
        ],
        alerts: [{ device_id: 'MOTOR_003', message: 'Temperature high', severity: 'warning' }],
        anomalies: [],
        maintenancePredictions: [],
        stats: { total_devices: 33, active_alerts: 5 },
        maintenance: 3,
        loading: false
      });
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (data.loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
          <p className="text-white mt-4">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-blue-400">⚡ IoT Energy Monitor</h1>
        <p className="text-gray-300 text-lg">Smart Energy & Safety Dashboard</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-6">
          <div className="text-blue-400 text-sm font-medium">TOTAL DEVICES</div>
          <div className="text-3xl font-bold text-white mt-2">
            {data.stats.total_devices || data.devices.length}
          </div>
          <div className="text-blue-300 text-sm">Connected</div>
        </div>

        <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-xl p-6">
          <div className="text-yellow-400 text-sm font-medium">ACTIVE ALERTS</div>
          <div className="text-3xl font-bold text-white mt-2">
            {data.stats.active_alerts || data.alerts.length}
          </div>
          <div className="text-yellow-300 text-sm">Need Attention</div>
        </div>

        <div className="bg-red-600/20 border border-red-500/30 rounded-xl p-6">
          <div className="text-red-400 text-sm font-medium">AI ANOMALIES (24h)</div>
          <div className="text-3xl font-bold text-white mt-2">{data.anomalies.length}</div>
          <div className="text-red-300 text-sm">AI Detected</div>
        </div>

        <div className="bg-purple-600/20 border border-purple-500/30 rounded-xl p-6">
          <div className="text-purple-400 text-sm font-medium">MAINTENANCE</div>
          <div className="text-3xl font-bold text-white mt-2">{data.maintenance}</div>
          <div className="text-purple-300 text-sm">Predictions</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Devices */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Devices ({data.devices.length})
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {data.devices.slice(0, 10).map((device, index) => (
              <div key={index} className="bg-gray-700/50 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <div className="font-medium text-white">{device.device_id}</div>
                  <div className="text-sm text-gray-400">{device.location || 'Unknown Location'}</div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  device.status === 'active'
                    ? 'bg-green-500/20 text-green-400'
                    : device.status === 'warning'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {device.status || 'active'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-gray-800 rounded-xl p-6 mb-10">
          <h2 className="text-xl font-semibold text-white mb-4">
            Active Alerts ({data.alerts.length})
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {data.alerts.slice(0, 8).map((alert, index) => (
              <div key={index} className="border border-yellow-500/30 bg-yellow-500/10 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium text-yellow-400">{alert.device_id}</div>
                    <div className="text-sm text-yellow-300">
                      {alert.message || 'System alert'}
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
                    {alert.severity || 'warning'}
                  </span>
                </div>
              </div>
            ))}
            {data.alerts.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400">✅ No active alerts</div>
                <div className="text-gray-500 text-sm">All systems normal</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Anomalies Section - Last 24 Hours */}
      {data.anomalies.length > 0 && (
        <div className="mt-12 bg-red-600/20 border border-red-500/30 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-red-400 mb-4">
            🤖 AI Anomalies - Last 24 Hours ({data.anomalies.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-80 overflow-y-auto">
            {data.anomalies.slice(0, 12).map((anomaly, index) => (
              <div key={index} className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="font-medium text-red-400">{anomaly.device_id}</div>
                <div className="text-sm text-red-300 mt-1">
                  Score: {(anomaly.anomaly_score || 0).toFixed(3)}
                </div>
                <div className="text-xs text-gray-400 mt-2">
                  {new Date(anomaly.timestamp).toLocaleString()}
                </div>
                {anomaly.features && (
                  <div className="text-xs text-gray-300 mt-2">
                    Temp: {anomaly.features.temperature?.toFixed(1)}°C | 
                    Power: {anomaly.features.power_consumption?.toFixed(2)}kW
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Maintenance Predictions */}
      {data.maintenance > 0 && (
        <div className="mt-20 bg-purple-600/20 border border-purple-500/30 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-purple-400 mb-4">
            🔧 AI Maintenance Predictions ({data.maintenance})
          </h2>
          
          {/* Urgent maintenance alert */}
          {data.maintenancePredictions.length > 0 && (
            <>
              {(() => {
                const urgentDevices = data.maintenancePredictions.filter(p => p.days_until_maintenance < 25);
                return urgentDevices.length > 0 ? (
                  <div className="mb-4 bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                    <div className="text-orange-400 font-semibold mb-2">
                      ⚠️ Urgent: {urgentDevices.length} devices need maintenance within 25 days
                    </div>
                    <div className="text-sm text-orange-300">
                      {urgentDevices.slice(0, 3).map(d => d.device_id).join(', ')}
                      {urgentDevices.length > 3 && ` and ${urgentDevices.length - 3} more`}
                    </div>
                  </div>
                ) : null;
              })()}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-80 overflow-y-auto">
                {data.maintenancePredictions.slice(0, 12).map((prediction, index) => (
                  <div key={index} className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                    <div className="font-medium text-purple-400">{prediction.device_id}</div>
                    <div className="text-sm text-purple-300 mt-1">
                      {prediction.days_until_maintenance} days until maintenance
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      Score: {prediction.maintenance_score?.toFixed(3)}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${
                      prediction.days_until_maintenance < 25
                        ? 'bg-orange-500/20 text-orange-300'
                        : prediction.priority === 'high'
                        ? 'bg-red-500/20 text-red-300'
                        : prediction.priority === 'medium'
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : 'bg-green-500/20 text-green-300'
                    }`}>
                      {prediction.days_until_maintenance < 25 ? 'urgent' : prediction.priority} priority
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          
          {data.maintenancePredictions.length === 0 && (
            <div className="text-white">
              <div className="text-lg">{data.maintenance} devices need maintenance soon</div>
              <div className="text-purple-300 text-sm">Based on predictive analytics</div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 text-center text-gray-500 text-sm">
        Last updated: {new Date().toLocaleTimeString()} • Auto-refresh: 30s
      </div>
    </div>
  );
}

export default App;
