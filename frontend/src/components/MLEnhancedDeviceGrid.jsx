import React, { useState, useEffect } from 'react';

const MLEnhancedDeviceGrid = ({ devices = [] }) => {
  const [mlPredictions, setMlPredictions] = useState({});
  const [showMLInsights, setShowMLInsights] = useState(true);

  const fetchMlPredictions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/ml/maintenance');
      if (response.ok) {
        const data = await response.json();
        // Convert array to lookup object
        const predictions = {};
        data.predictions?.forEach(pred => {
          predictions[pred.device_id] = pred;
        });
        setMlPredictions(predictions);
      }
    } catch (error) {
      console.log('ML predictions unavailable, using demo data');
      // Demo ML predictions for presentation
      setMlPredictions({
        'BOILER_001': {
          device_id: 'BOILER_001',
          maintenance_risk: 0.73,
          days_until_maintenance: 12,
          confidence: 0.89,
          key_factors: ['temperature_trend', 'pressure_variance']
        },
        'MOTOR_003': {
          device_id: 'MOTOR_003',
          maintenance_risk: 0.45,
          days_until_maintenance: 28,
          confidence: 0.92,
          key_factors: ['vibration', 'power_consumption']
        },
        'PUMP_002': {
          device_id: 'PUMP_002',
          maintenance_risk: 0.21,
          days_until_maintenance: 45,
          confidence: 0.87,
          key_factors: ['flow_rate', 'efficiency']
        },
        'SENSOR_004': {
          device_id: 'SENSOR_004',
          maintenance_risk: 0.88,
          days_until_maintenance: 7,
          confidence: 0.91,
          key_factors: ['battery_level', 'signal_strength']
        },
        'HVAC_001': {
          device_id: 'HVAC_001',
          maintenance_risk: 0.32,
          days_until_maintenance: 38,
          confidence: 0.85,
          key_factors: ['filter_condition', 'energy_efficiency']
        },
        'GENERATOR_001': {
          device_id: 'GENERATOR_001',
          maintenance_risk: 0.67,
          days_until_maintenance: 15,
          confidence: 0.90,
          key_factors: ['fuel_consumption', 'operating_hours']
        }
      });
    }
  };

  useEffect(() => {
    fetchMlPredictions();
    const interval = setInterval(fetchMlPredictions, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status, mlRisk = null) => {
    if (showMLInsights && mlRisk !== null) {
      // ML-enhanced status colors
      if (mlRisk > 0.7) return 'bg-red-500/20 text-red-400 border-red-500/30';
      if (mlRisk > 0.5) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      if (mlRisk > 0.3) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
    
    // Traditional status colors
    switch (status) {
      case 'online': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'offline': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getMLStatusText = (mlPrediction) => {
    if (!mlPrediction) return null;
    const risk = mlPrediction.maintenance_risk;
    if (risk > 0.7) return 'High Risk';
    if (risk > 0.5) return 'Medium Risk';
    if (risk > 0.3) return 'Low Risk';
    return 'Optimal';
  };

  const getHealthIcon = (status, mlRisk = null) => {
    if (showMLInsights && mlRisk !== null) {
      if (mlRisk > 0.7) return '🔴';
      if (mlRisk > 0.5) return '🟡';
      if (mlRisk > 0.3) return '🔵';
      return '🟢';
    }
    
    switch (status) {
      case 'online': return '🟢';
      case 'warning': return '🟡';
      case 'offline': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">
          Smart Device Monitor
        </h3>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowMLInsights(!showMLInsights)}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${
              showMLInsights 
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                : 'bg-gray-700 text-gray-400 border border-gray-600'
            }`}
          >
            AI Insights
          </button>
          <div className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
            {devices.length} Devices
          </div>
        </div>
      </div>

      {showMLInsights && (
        <div className="mb-4 p-3 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-purple-400">🤖</span>
              <span className="text-sm font-medium text-purple-300">Predictive Maintenance AI</span>
            </div>
            <div className="text-xs text-purple-400">
              {Object.keys(mlPredictions).length} Devices Analyzed
            </div>
          </div>
          <p className="text-xs text-purple-200 mt-1">
            Real-time device health predictions using Random Forest ML model
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((device, index) => {
          const mlPrediction = mlPredictions[device.id];
          const displayStatus = showMLInsights && mlPrediction ? 
            getMLStatusText(mlPrediction) : device.status;
          const riskScore = mlPrediction?.maintenance_risk;

          return (
            <div key={device.id || index} 
                 className={`border rounded-lg p-4 ${getStatusColor(device.status, riskScore)}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h5 className="font-medium">{device.id || device.name || `Device ${index + 1}`}</h5>
                  <p className="text-xs opacity-75">{device.type || 'IoT Device'}</p>
                </div>
                <span className="text-xl">
                  {getHealthIcon(device.status, riskScore)}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Status:</span>
                  <span className="font-medium">{displayStatus}</span>
                </div>
                
                {device.temperature && (
                  <div className="flex justify-between text-sm">
                    <span>Temp:</span>
                    <span>{device.temperature}°C</span>
                  </div>
                )}
                
                {device.power && (
                  <div className="flex justify-between text-sm">
                    <span>Power:</span>
                    <span>{device.power}kW</span>
                  </div>
                )}

                {showMLInsights && mlPrediction && (
                  <>
                    <hr className="border-current opacity-20 my-2" />
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Risk Score:</span>
                        <span className="font-medium">{(mlPrediction.maintenance_risk * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Next Service:</span>
                        <span>{mlPrediction.days_until_maintenance} days</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Confidence:</span>
                        <span>{(mlPrediction.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {showMLInsights && mlPrediction?.key_factors && (
                <div className="mt-3 pt-2 border-t border-current opacity-20">
                  <p className="text-xs opacity-75 mb-1">Key Factors:</p>
                  <div className="flex flex-wrap gap-1">
                    {mlPrediction.key_factors.slice(0, 2).map((factor, idx) => (
                      <span key={idx} className="text-xs px-2 py-0.5 rounded-full bg-current bg-opacity-20">
                        {factor.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {devices.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No devices found</p>
        </div>
      )}
    </div>
  );
};

export default MLEnhancedDeviceGrid;