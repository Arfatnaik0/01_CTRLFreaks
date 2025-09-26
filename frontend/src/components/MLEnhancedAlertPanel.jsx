import React, { useState, useEffect } from 'react';

const MLEnhancedAlertPanel = ({ alerts = [] }) => {
  const [mlAnomalies, setMlAnomalies] = useState([]);
  const [showMLOnly, setShowMLOnly] = useState(false);

  const fetchMLAnomalies = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/ml/anomalies');
      if (response.ok) {
        const data = await response.json();
        setMlAnomalies(data.anomalies || []);
      }
    } catch (error) {
      console.log('ML anomalies unavailable, using demo data');
      // Demo ML anomalies for presentation
      setMlAnomalies([
        {
          device_id: 'BOILER_001',
          timestamp: new Date().toISOString(),
          anomaly_score: -0.0592,
          features: { temperature: 135.9, pressure: 8.93, power_consumption: 6.01 }
        },
        {
          device_id: 'MOTOR_003',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          anomaly_score: -0.0431,
          features: { temperature: 78.2, pressure: 12.1, power_consumption: 4.2 }
        },
        {
          device_id: 'PUMP_002',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          anomaly_score: -0.0278,
          features: { temperature: 65.4, pressure: 15.2, power_consumption: 3.8 }
        }
      ]);
    }
  };

  useEffect(() => {
    fetchMLAnomalies();
    const interval = setInterval(fetchMLAnomalies, 30000);
    return () => clearInterval(interval);
  }, []);

  const combinedAlerts = [
    ...mlAnomalies.map(anomaly => ({
      ...anomaly,
      type: 'ml-anomaly',
      severity: anomaly.anomaly_score < -0.05 ? 'critical' : 'warning',
      message: `ML-detected anomaly: Temperature ${anomaly.features?.temperature?.toFixed(1)}°C, Power ${anomaly.features?.power_consumption?.toFixed(2)}kW`,
      is_ml: true
    })),
    ...alerts.map(alert => ({ ...alert, type: 'traditional', is_ml: false }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const displayAlerts = showMLOnly ? 
    combinedAlerts.filter(alert => alert.is_ml) : 
    combinedAlerts;

  const getSeverityColor = (severity, isML = false) => {
    const baseColors = {
      'critical': 'border-red-500/30 bg-red-500/10 text-red-400',
      'warning': 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
      'info': 'border-blue-500/30 bg-blue-500/10 text-blue-400'
    };
    
    if (isML) {
      return severity === 'critical' ? 
        'border-purple-500/30 bg-purple-500/10 text-purple-400' : 
        'border-indigo-500/30 bg-indigo-500/10 text-indigo-400';
    }
    
    return baseColors[severity] || baseColors.info;
  };

  const getSeverityIcon = (severity, isML = false) => {
    if (isML) return '🤖';
    return severity === 'critical' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️';
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          Smart Alert System
        </h3>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowMLOnly(!showMLOnly)}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                showMLOnly 
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                  : 'bg-gray-700 text-gray-400 border border-gray-600'
              }`}
            >
              ML Only
            </button>
          </div>
          <div className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
            {displayAlerts.length} Active
          </div>
        </div>
      </div>

      {/* ML Analytics Summary */}
      <div className="mb-4 p-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-purple-400">🧠</span>
            <span className="text-sm font-medium text-purple-300">AI-Enhanced Alert System</span>
          </div>
          <div className="text-xs text-purple-400">
            {mlAnomalies.length} ML Anomalies | {alerts.length} Traditional Alerts
          </div>
        </div>
        <p className="text-xs text-purple-200 mt-1">
          Real-time anomaly detection powered by Isolation Forest ML model
        </p>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {displayAlerts.slice(0, 8).map((alert, index) => (
          <div key={`${alert.id || index}-${alert.device_id}`} 
               className={`border rounded-lg p-3 ${getSeverityColor(alert.severity, alert.is_ml)}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h5 className="font-medium">{alert.device_id || `Alert ${index + 1}`}</h5>
                  {alert.is_ml && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 border border-purple-500/50">
                      ML DETECTED
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-current bg-opacity-20 capitalize">
                    {alert.severity || 'warning'}
                  </span>
                </div>
                <p className="text-sm mb-2">{alert.message || 'System alert detected'}</p>
                <div className="flex items-center justify-between text-xs">
                  <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                  {alert.is_ml && (
                    <span>Anomaly Score: {alert.anomaly_score?.toFixed(4)}</span>
                  )}
                </div>
              </div>
              <span className="text-xl ml-3">
                {getSeverityIcon(alert.severity, alert.is_ml)}
              </span>
            </div>
          </div>
        ))}
        
        {displayAlerts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400">No alerts matching current filter</p>
          </div>
        )}
      </div>

      {displayAlerts.length > 8 && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Showing 8 of {displayAlerts.length} alerts
          </p>
        </div>
      )}
    </div>
  );
};

export default MLEnhancedAlertPanel;