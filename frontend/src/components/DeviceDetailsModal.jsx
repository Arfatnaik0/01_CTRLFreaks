import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';

const DeviceDetailsModal = ({ device, isOpen, onClose }) => {
  const [deviceReadings, setDeviceReadings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (isOpen && device) {
      fetchDeviceDetails();
    }
  }, [isOpen, device]);

  const fetchDeviceDetails = async () => {
    setLoading(true);
    try {
      const readings = await ApiService.getDeviceReadings(device.device_id, 20);
      setDeviceReadings(readings.readings || []);
    } catch (error) {
      console.error('Failed to fetch device details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !device) return null;

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

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusBadge = (reading) => {
    if (reading.maintenance_required) {
      return <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Maintenance</span>;
    }
    if (!reading.is_active) {
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Inactive</span>;
    }
    if (reading.relay_status === 'OFF') {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">OFF</span>;
    }
    return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>;
  };

  const calculateStats = () => {
    if (!deviceReadings.length) return { max: {}, min: {}, avg: {} };

    const stats = deviceReadings.reduce((acc, reading) => {
      ['current', 'temperature', 'pressure'].forEach(metric => {
        if (!acc.max[metric] || reading[metric] > acc.max[metric]) {
          acc.max[metric] = reading[metric];
        }
        if (!acc.min[metric] || reading[metric] < acc.min[metric]) {
          acc.min[metric] = reading[metric];
        }
        acc.sum[metric] = (acc.sum[metric] || 0) + reading[metric];
      });
      return acc;
    }, { max: {}, min: {}, sum: {} });

    const avg = {};
    ['current', 'temperature', 'pressure'].forEach(metric => {
      avg[metric] = stats.sum[metric] / deviceReadings.length;
    });

    return { max: stats.max, min: stats.min, avg };
  };

  const stats = calculateStats();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">{getDeviceIcon(device.device_type)}</div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {device.device_id}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 capitalize">
                {device.device_type?.replace('_', ' ')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            Recent History
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'statistics'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            Statistics
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Current Status */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-100">
                  Current Status
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                    <div className="text-sm text-slate-500 dark:text-slate-400">Current</div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                      {device.avg_current?.toFixed(2) || '0.00'}A
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                    <div className="text-sm text-slate-500 dark:text-slate-400">Temperature</div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                      {device.avg_temperature?.toFixed(1) || '0.0'}°C
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                    <div className="text-sm text-slate-500 dark:text-slate-400">Pressure</div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                      {device.avg_pressure?.toFixed(1) || '0.0'} PSI
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                    <div className="text-sm text-slate-500 dark:text-slate-400">Total Readings</div>
                    <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                      {device.total_readings || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Device Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-100">
                  Device Information
                </h3>
                <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Device ID:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-100">{device.device_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Type:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-100 capitalize">
                      {device.device_type?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Status:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {device.current_status || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Relay:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {device.relay_status || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Last Seen:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {device.last_seen ? formatTimestamp(device.last_seen) : 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">
                Recent Readings
              </h3>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-slate-500 dark:text-slate-400">Loading readings...</p>
                </div>
              ) : deviceReadings.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  No readings available
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {deviceReadings.map((reading, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="font-medium text-slate-800 dark:text-slate-100">
                            {reading.current?.toFixed(2)}A
                          </span>
                          <span className="text-slate-600 dark:text-slate-300">
                            {reading.temperature?.toFixed(1)}°C
                          </span>
                          <span className="text-slate-600 dark:text-slate-300">
                            {reading.pressure?.toFixed(1)} PSI
                          </span>
                          {getStatusBadge(reading)}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                          {formatTimestamp(reading.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'statistics' && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">
                Statistics (Last 20 Readings)
              </h3>
              {deviceReadings.length === 0 ? (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  No data available for statistics
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Current Statistics */}
                  <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">Current (A)</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Maximum:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                          {stats.max.current?.toFixed(2) || '0.00'}A
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Average:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                          {stats.avg.current?.toFixed(2) || '0.00'}A
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Minimum:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                          {stats.min.current?.toFixed(2) || '0.00'}A
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Temperature Statistics */}
                  <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">Temperature (°C)</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Maximum:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                          {stats.max.temperature?.toFixed(1) || '0.0'}°C
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Average:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                          {stats.avg.temperature?.toFixed(1) || '0.0'}°C
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Minimum:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                          {stats.min.temperature?.toFixed(1) || '0.0'}°C
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pressure Statistics */}
                  <div>
                    <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">Pressure (PSI)</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Maximum:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                          {stats.max.pressure?.toFixed(1) || '0.0'} PSI
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Average:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                          {stats.avg.pressure?.toFixed(1) || '0.0'} PSI
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Minimum:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                          {stats.min.pressure?.toFixed(1) || '0.0'} PSI
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeviceDetailsModal;