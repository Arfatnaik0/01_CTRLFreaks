import React, { useState } from 'react';

const DeviceCard = ({ device, onControl }) => {
  const [isControlling, setIsControlling] = useState(false);

  const getDeviceIcon = (type) => {
    const icons = {
      pump: '🔧',
      motor: '⚙️',
      heater: '🔥',
      compressor: '💨',
      conveyor: '📦',
      sensor_unit: '📊'
    };
    return icons[type] || '🏭';
  };

  const getStatusColor = (device) => {
    const avgCurrent = device.avg_current || 0;
    const avgTemp = device.avg_temperature || 0;
    
    if (avgCurrent > 20 || avgTemp > 35) return 'red';
    if (avgCurrent > 15 || avgTemp > 30) return 'yellow';
    return 'green';
  };

  const handleToggleRelay = async () => {
    setIsControlling(true);
    try {
      // Assume relay is ON if current > 0, otherwise OFF
      const currentStatus = device.avg_current > 0 ? 'ON' : 'OFF';
      const newStatus = currentStatus === 'ON' ? 'OFF' : 'ON';
      await onControl(device.device_id, 'relay', newStatus);
    } catch (error) {
      console.error('Failed to toggle relay:', error);
    } finally {
      setIsControlling(false);
    }
  };

  const statusColor = getStatusColor(device);
  const statusColors = {
    green: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    red: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="p-6">
        {/* Device Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getDeviceIcon(device.device_type)}</div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-lg">
                {device.device_id}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm capitalize">
                {device.device_type?.replace('_', ' ')}
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[statusColor]}`}>
            {statusColor === 'green' ? 'Optimal' : statusColor === 'yellow' ? 'Warning' : 'Critical'}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {device.avg_current?.toFixed(1) || '0.0'}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">A</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Current</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {device.avg_temperature?.toFixed(1) || '0.0'}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">°C</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Temperature</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {device.avg_pressure?.toFixed(1) || '0.0'}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">PSI</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Pressure</div>
          </div>
        </div>

        {/* Device Stats */}
        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400 mb-4">
          <div>
            <span className="font-medium">{device.reading_count || 0}</span> readings
          </div>
          <div>
            Last seen: {device.last_seen ? new Date(device.last_seen).toLocaleTimeString() : 'Unknown'}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleToggleRelay}
            disabled={isControlling}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              device.avg_current > 0
                ? 'bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-300'
                : 'bg-green-100 hover:bg-green-200 text-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/40 dark:text-green-300'
            } disabled:opacity-50`}
          >
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {isControlling ? 'Processing...' : device.avg_current > 0 ? 'Turn Off' : 'Turn On'}
          </button>
          
          <button
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors duration-200"
            title="View Details"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Status Indicator */}
      <div className={`h-2 rounded-b-xl ${
        statusColor === 'green' ? 'bg-green-400' :
        statusColor === 'yellow' ? 'bg-yellow-400' : 'bg-red-400'
      }`}></div>
    </div>
  );
};

export default DeviceCard;