import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ApiService } from '../services/api';

const DeviceDetailsModal = ({ device, isOpen, onClose }) => {
  const [deviceReadings, setDeviceReadings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debug logging
  console.log('DeviceDetailsModal render:', { isOpen, device: device?.device_id, readingsCount: deviceReadings.length });

  useEffect(() => {
    if (isOpen && device) {
      console.log('Modal opened for device:', device.device_id);
      fetchDeviceDetails();
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      // Re-enable body scroll when modal is closed
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to ensure body scroll is re-enabled
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, device]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        console.log('Modal closing via Escape key');
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const fetchDeviceDetails = async () => {
    if (!device?.device_id) {
      console.error('No device ID provided');
      setError('No device ID provided');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('Fetching readings for device:', device.device_id);
      const response = await ApiService.getDeviceReadings(device.device_id, 20);
      console.log('API response:', response);
      const readings = response?.readings || [];
      setDeviceReadings(Array.isArray(readings) ? readings : []);
      console.log('Device readings set:', readings.length, 'readings');
    } catch (error) {
      console.error('Failed to fetch device details:', error);
      setError(`Failed to fetch device details: ${error.message}`);
      setDeviceReadings([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      console.log('Modal closing via backdrop click');
      onClose();
    }
  };

  if (!isOpen || !device) {
    console.log('Modal not rendering - isOpen:', isOpen, 'device:', !!device);
    return null;
  }

  // Simplified version for debugging
  if (error) {
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
        style={{ zIndex: 9999 }}
      >
        <div 
          className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-slate-700 dark:text-slate-300 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-500 text-white rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

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

  const calculateStats = () => {
    if (!deviceReadings || !Array.isArray(deviceReadings) || deviceReadings.length === 0) {
      return { 
        max: { current: 0, temperature: 0, pressure: 0 }, 
        min: { current: 0, temperature: 0, pressure: 0 }, 
        avg: { current: 0, temperature: 0, pressure: 0 } 
      };
    }

    try {
      const stats = deviceReadings.reduce((acc, reading) => {
        ['current', 'temperature', 'pressure'].forEach(metric => {
          const value = reading[metric];
          if (typeof value === 'number' && !isNaN(value)) {
            if (!acc.max[metric] || value > acc.max[metric]) {
              acc.max[metric] = value;
            }
            if (!acc.min[metric] || value < acc.min[metric]) {
              acc.min[metric] = value;
            }
            acc.sum[metric] = (acc.sum[metric] || 0) + value;
          }
        });
        return acc;
      }, { max: {}, min: {}, sum: {} });

      const avg = {};
      ['current', 'temperature', 'pressure'].forEach(metric => {
        avg[metric] = stats.sum[metric] ? stats.sum[metric] / deviceReadings.length : 0;
      });

      return { max: stats.max, min: stats.min, avg };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return { 
        max: { current: 0, temperature: 0, pressure: 0 }, 
        min: { current: 0, temperature: 0, pressure: 0 }, 
        avg: { current: 0, temperature: 0, pressure: 0 } 
      };
    }
  };

  const stats = calculateStats();

  // Create portal to render modal at the root level
  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      style={{ zIndex: 10000 }}
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">{getDeviceIcon(device.device_type)}</div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {device.device_id}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 capitalize">
                {device.device_type?.replace('_', ' ')} - Device Statistics
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

        {/* Content - Statistics Only */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto text-red-300 dark:text-red-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-red-600 dark:text-red-400 text-lg font-medium">Error Loading Data</p>
                <p className="text-red-500 dark:text-red-500 text-sm mt-1">{error}</p>
                <button 
                  onClick={fetchDeviceDetails}
                  className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
                <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">Loading statistics...</p>
              </div>
            </div>
          ) : deviceReadings.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">No data available</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Statistics will appear once data is collected</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Header */}
              <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                  Device Analytics
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Based on the last {deviceReadings.length} readings
                </p>
              </div>

              {/* Main Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Current Statistics */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 border border-emerald-200 dark:border-emerald-700/50 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center mb-4">
                    <div className="bg-emerald-500 p-2 rounded-lg mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h4 className="font-bold text-lg text-emerald-800 dark:text-emerald-200">
                      Current
                    </h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Max:</span>
                      <span className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
                        {stats.max.current?.toFixed(2) || '0.00'}A
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Avg:</span>
                      <span className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">
                        {stats.avg.current?.toFixed(2) || '0.00'}A
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Min:</span>
                      <span className="text-base font-medium text-emerald-700 dark:text-emerald-300">
                        {stats.min.current?.toFixed(2) || '0.00'}A
                      </span>
                    </div>
                  </div>
                </div>

                {/* Temperature Statistics */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-700/50 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center mb-4">
                    <div className="bg-red-500 p-2 rounded-lg mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h4 className="font-bold text-lg text-red-800 dark:text-red-200">
                      Temperature
                    </h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">Max:</span>
                      <span className="text-xl font-bold text-red-900 dark:text-red-100">
                        {stats.max.temperature?.toFixed(1) || '0.0'}°C
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">Avg:</span>
                      <span className="text-lg font-semibold text-red-800 dark:text-red-200">
                        {stats.avg.temperature?.toFixed(1) || '0.0'}°C
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">Min:</span>
                      <span className="text-base font-medium text-red-700 dark:text-red-300">
                        {stats.min.temperature?.toFixed(1) || '0.0'}°C
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pressure Statistics */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700/50 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-500 p-2 rounded-lg mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                    <h4 className="font-bold text-lg text-blue-800 dark:text-blue-200">
                      Pressure
                    </h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Max:</span>
                      <span className="text-xl font-bold text-blue-900 dark:text-blue-100">
                        {stats.max.pressure?.toFixed(1) || '0.0'} PSI
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Avg:</span>
                      <span className="text-lg font-semibold text-blue-800 dark:text-blue-200">
                        {stats.avg.pressure?.toFixed(1) || '0.0'} PSI
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Min:</span>
                      <span className="text-base font-medium text-blue-700 dark:text-blue-300">
                        {stats.min.pressure?.toFixed(1) || '0.0'} PSI
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body // Portal target
  );
};

export default DeviceDetailsModal;