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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Enhanced Header with gradient background */}
      <div className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-blue-600/10 backdrop-blur-sm border-b border-gray-700/50">
        <div className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                ⚡ IoT Energy Monitor
              </h1>
              <p className="text-gray-300 text-xl mt-2">Smart Energy & Safety Dashboard</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-full">
                <span className="text-green-400 text-sm font-medium">● LIVE</span>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Last Updated</div>
                <div className="text-green-400 font-mono text-sm">{new Date().toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Enhanced Stats Cards with animations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="group bg-gradient-to-br from-blue-600/20 to-blue-500/10 border border-blue-500/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <span className="text-2xl">🏭</span>
              </div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
            <div className="text-blue-400 text-sm font-medium tracking-wide">TOTAL DEVICES</div>
            <div className="text-4xl font-bold text-white mt-2 mb-1">
              {data.stats.total_devices || data.devices.length}
            </div>
            <div className="text-blue-300 text-sm">Connected & Monitored</div>
          </div>

          <div className="group bg-gradient-to-br from-yellow-600/20 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-500/20 rounded-xl">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
            </div>
            <div className="text-yellow-400 text-sm font-medium tracking-wide">ACTIVE ALERTS</div>
            <div className="text-4xl font-bold text-white mt-2 mb-1">
              {data.stats.active_alerts || data.alerts.length}
            </div>
            <div className="text-yellow-300 text-sm">Require Attention</div>
          </div>

          <div className="group bg-gradient-to-br from-red-600/20 to-pink-500/10 border border-red-500/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-500/20 rounded-xl">
                <span className="text-2xl">🤖</span>
              </div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            </div>
            <div className="text-red-400 text-sm font-medium tracking-wide">AI ANOMALIES (24h)</div>
            <div className="text-4xl font-bold text-white mt-2 mb-1">{data.anomalies.length}</div>
            <div className="text-red-300 text-sm">AI Detected Issues</div>
          </div>

          <div className="group bg-gradient-to-br from-purple-600/20 to-indigo-500/10 border border-purple-500/30 rounded-2xl p-6 hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <span className="text-2xl">🔧</span>
              </div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            </div>
            <div className="text-purple-400 text-sm font-medium tracking-wide">MAINTENANCE</div>
            <div className="text-4xl font-bold text-white mt-2 mb-1">{data.maintenance}</div>
            <div className="text-purple-300 text-sm">Predicted Needs</div>
          </div>
        </div>

        {/* Enhanced Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Enhanced Devices Section */}
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <span className="mr-3 p-2 bg-blue-500/20 rounded-lg">🏭</span>
                Devices ({data.devices.length})
              </h2>
              <div className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-400 text-sm">
                Live Status
              </div>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
              {data.devices.slice(0, 10).map((device, index) => (
                <div key={index} className="group bg-gradient-to-r from-gray-700/30 to-gray-800/30 rounded-xl p-5 flex justify-between items-center hover:from-gray-600/40 hover:to-gray-700/40 transition-all duration-200 border border-gray-600/20">
                  <div className="flex items-center space-x-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <div className="font-semibold text-white text-lg group-hover:text-blue-300 transition-colors">
                        {device.device_id}
                      </div>
                      <div className="text-sm text-gray-400">{device.location || 'Unknown Location'}</div>
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium shadow-lg ${
                    device.status === 'active'
                      ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border border-green-500/30'
                      : device.status === 'warning'
                      ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border border-yellow-500/30'
                      : 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 border border-red-500/30'
                  }`}>
                    {device.status || 'active'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced Alerts Section */}
          <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 backdrop-blur-sm border border-yellow-500/30 rounded-2xl p-8 hover:shadow-2xl hover:shadow-yellow-500/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <span className="mr-3 p-2 bg-yellow-500/20 rounded-lg">⚠️</span>
                Active Alerts ({data.alerts.length})
              </h2>
              <div className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full text-yellow-400 text-sm animate-pulse">
                Monitoring
              </div>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
              {data.alerts.slice(0, 8).map((alert, index) => (
                <div key={index} className="group border border-yellow-500/40 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-5 hover:from-yellow-500/20 hover:to-orange-500/20 transition-all duration-200 shadow-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-yellow-500/20 rounded-lg mt-1">
                        <span className="text-yellow-400">⚠️</span>
                      </div>
                      <div>
                        <div className="font-semibold text-yellow-200 text-lg group-hover:text-yellow-100 transition-colors">
                          {alert.device_id}
                        </div>
                        <p className="text-yellow-300 mt-1">{alert.message}</p>
                        <div className="text-xs text-yellow-400 mt-2 opacity-70">
                          {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : 'Just now'}
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg ${
                      alert.severity === 'critical' 
                        ? 'bg-gradient-to-r from-red-500/30 to-pink-500/30 text-red-300 border border-red-500/40 animate-pulse' 
                        : alert.severity === 'warning'
                        ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 text-yellow-300 border border-yellow-500/40'
                        : 'bg-gradient-to-r from-blue-500/30 to-cyan-500/30 text-blue-300 border border-blue-500/40'
                    }`}>
                      {alert.severity || 'warning'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Enhanced AI Anomalies Section - Last 24 Hours */}
        {data.anomalies.length > 0 && (
          <div className="mt-20 bg-gradient-to-br from-red-900/30 to-pink-900/20 backdrop-blur-sm border border-red-500/30 rounded-2xl p-8 hover:shadow-2xl hover:shadow-red-500/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <span className="mr-3 p-2 bg-red-500/20 rounded-lg">🤖</span>
                AI Anomalies - Last 24 Hours ({data.anomalies.length})
              </h2>
              <div className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-red-400 text-sm animate-pulse">
                AI Monitoring
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-96 overflow-y-auto custom-scrollbar">
              {data.anomalies.slice(0, 12).map((anomaly, index) => (
                <div key={index} className="group bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/30 rounded-xl p-5 hover:from-red-500/20 hover:to-pink-500/20 transition-all duration-200 shadow-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <span className="text-red-400">🚨</span>
                    </div>
                    <div className="text-xs text-red-400 opacity-70">
                      {anomaly.timestamp ? new Date(anomaly.timestamp).toLocaleString() : 'Recent'}
                    </div>
                  </div>
                                    <div className="font-bold text-red-200 text-lg mb-2 group-hover:text-red-100 transition-colors">
                    {anomaly.device_id}
                  </div>
                  <div className="text-sm text-red-300 mb-3">
                    Anomaly Score: <span className="font-mono font-bold text-red-200">{(anomaly.anomaly_score || 0).toFixed(3)}</span>
                  </div>
                  <div className="h-2 bg-red-900/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-500 ease-out"
                      style={{ width: `${Math.min((anomaly.anomaly_score || 0) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
                </div>
              ))}
            </div>
          </div>
        )}
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

        {/* Enhanced AI Maintenance Predictions */}
        {data.maintenance > 0 && (
          <div className="mt-20 bg-gradient-to-br from-purple-900/30 to-indigo-900/20 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <span className="mr-3 p-2 bg-purple-500/20 rounded-lg">🔧</span>
                AI Maintenance Predictions ({data.maintenance})
              </h2>
              <div className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-400 text-sm">
                Predictive Analytics
              </div>
            </div>
            
            {/* Enhanced Urgent maintenance alert */}
            {data.maintenancePredictions.length > 0 && (
              <>
                {(() => {
                  const urgentDevices = data.maintenancePredictions.filter(p => p.days_until_maintenance < 25);
                  return urgentDevices.length > 0 ? (
                    <div className="mb-6 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/40 rounded-xl p-6 shadow-lg">
                      <div className="flex items-center mb-3">
                        <span className="mr-3 p-2 bg-orange-500/20 rounded-lg">🚨</span>
                        <div className="text-orange-300 font-bold text-lg">
                          Urgent: {urgentDevices.length} devices need maintenance within 25 days
                        </div>
                      </div>
                      <div className="text-orange-200 bg-orange-500/10 rounded-lg p-3 font-mono text-sm">
                        {urgentDevices.slice(0, 3).map(d => d.device_id).join(', ')}
                        {urgentDevices.length > 3 && ` and ${urgentDevices.length - 3} more`}
                      </div>
                    </div>
                  ) : null;
                })()}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-96 overflow-y-auto custom-scrollbar">
                  {data.maintenancePredictions.slice(0, 12).map((prediction, index) => (
                    <div key={index} className="group bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/30 rounded-xl p-5 hover:from-purple-500/20 hover:to-indigo-500/20 transition-all duration-200 shadow-lg">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <span className="text-purple-400">🔧</span>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold shadow-lg ${
                          prediction.days_until_maintenance < 25
                            ? 'bg-gradient-to-r from-orange-500/30 to-red-500/30 text-orange-300 border border-orange-500/40 animate-pulse'
                            : prediction.priority === 'high'
                            ? 'bg-gradient-to-r from-red-500/30 to-pink-500/30 text-red-300 border border-red-500/40'
                            : prediction.priority === 'medium'
                            ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 text-yellow-300 border border-yellow-500/40'
                            : 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 text-green-300 border border-green-500/40'
                        }`}>
                          {prediction.days_until_maintenance < 25 ? 'URGENT' : prediction.priority?.toUpperCase() || 'NORMAL'}
                        </div>
                      </div>
                      <div className="font-bold text-purple-200 text-lg mb-2 group-hover:text-purple-100 transition-colors">
                        {prediction.device_id}
                      </div>
                      <div className="text-sm text-purple-300 mb-3">
                        <span className="font-semibold">{prediction.days_until_maintenance}</span> days until maintenance
                      </div>
                      {prediction.maintenance_score && (
                        <div className="text-xs text-purple-400 mb-3">
                          Confidence: <span className="font-mono font-bold text-purple-200">{prediction.maintenance_score.toFixed(3)}</span>
                        </div>
                      )}
                      <div className="h-2 bg-purple-900/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500 ease-out"
                          style={{ width: `${Math.max(100 - (prediction.days_until_maintenance / 30 * 100), 10)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {data.maintenancePredictions.length === 0 && (
              <div className="text-center py-8">
                <div className="p-4 bg-purple-500/20 rounded-2xl inline-flex items-center space-x-3">
                  <span className="text-2xl">🔧</span>
                  <div>
                    <div className="text-white text-lg font-semibold">{data.maintenance} devices need maintenance soon</div>
                    <div className="text-purple-300 text-sm">Based on predictive analytics</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Enhanced Footer */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-4 bg-gray-800/50 border border-gray-700/50 rounded-full px-6 py-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <div className="text-gray-300 text-sm">
              Last updated: <span className="font-mono text-green-400">{new Date().toLocaleTimeString()}</span>
            </div>
            <div className="text-gray-500 text-sm">•</div>
            <div className="text-gray-400 text-sm">Auto-refresh: 30s</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
