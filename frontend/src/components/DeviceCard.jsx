import React, { useState } from 'react';
import DeviceDetailsModal from './DeviceDetailsModal';
import ErrorBoundary from './ErrorBoundary';

const DeviceCard = ({ device, onControl }) => {
  const [isControlling, setIsControlling] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isModalOpening, setIsModalOpening] = useState(false);

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
    
    // Check if device is turned off (check backend relay_status)
    if (device.relay_status === 'OFF') {
      return 'gray';
    }
    
    if (avgCurrent > 20 || avgTemp > 35) return 'red';
    if (avgCurrent > 15 || avgTemp > 30) return 'yellow';
    return 'green';
  };

  const handleTurnOff = async () => {
    setIsControlling(true);
    try {
      // Explicitly turn off the device
      await onControl(device.device_id, 'relay', 'OFF');
      
      // Show success notification
      setNotification({
        type: 'success',
        message: `Device ${device.device_id} has been turned off successfully`
      });
      
      // Auto-hide notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
      
    } catch (error) {
      console.error('Failed to turn off device:', error);
      
      // Show error notification
      setNotification({
        type: 'error',
        message: `Failed to turn off device ${device.device_id}`
      });
      
      // Auto-hide notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
      
    } finally {
      setIsControlling(false);
    }
  };

  const handleViewDetails = () => {
    // Prevent multiple modals from opening
    if (!showDetails && !isModalOpening) {
      console.log('Opening modal for device:', device.device_id);
      setIsModalOpening(true);
      setShowDetails(true);
      
      // Reset the opening flag after a short delay
      setTimeout(() => {
        setIsModalOpening(false);
      }, 500);
    }
  };

  const statusColor = getStatusColor(device);
  const statusColors = {
    green: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    red: 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
    gray: 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-800'
  };

  return (
    <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
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
            {statusColor === 'green' ? 'Optimal' : statusColor === 'yellow' ? 'Warning' : statusColor === 'red' ? 'Critical' : 'Turned Off'}
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

        {/* Device Stats - Removed readings and last seen */}
        
        {/* Control Buttons */}
        <div className="flex space-x-2">
          {/* Turn Off Button - Only button for device control */}
          <button
            onClick={handleTurnOff}
            disabled={isControlling || device.relay_status === 'OFF'}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              device.relay_status === 'OFF'
                ? 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
                : 'bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-300'
            } disabled:opacity-50`}
            title={
              device.relay_status === 'OFF'
                ? 'Device is already off' 
                : 'Turn off device'
            }
          >
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            {isControlling 
              ? 'Turning Off...' 
              : device.relay_status === 'OFF'
                ? 'Turned Off' 
                : 'Turn Off'
            }
          </button>
          
          {/* View Details Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleViewDetails();
            }}
            className="px-4 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg font-medium transition-colors duration-200"
            title="View Device Details"
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
        statusColor === 'yellow' ? 'bg-yellow-400' : 
        statusColor === 'red' ? 'bg-red-400' : 'bg-gray-400'
      }`}></div>

      {/* Notification Toast */}
      {notification && (
        <div className={`absolute top-2 left-2 right-2 p-3 rounded-lg shadow-lg z-10 ${
          notification.type === 'success' 
            ? 'bg-green-100 border border-green-300 text-green-800 dark:bg-green-800 dark:border-green-600 dark:text-green-100'
            : 'bg-red-100 border border-red-300 text-red-800 dark:bg-red-800 dark:border-red-600 dark:text-red-100'
        } animate-fade-in`}
        >
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
            <span className="text-sm font-medium">{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="ml-auto flex-shrink-0 p-1 hover:bg-black hover:bg-opacity-10 dark:hover:bg-white dark:hover:bg-opacity-10 rounded"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Device Details Modal */}
      {showDetails && (
        <ErrorBoundary>
          <DeviceDetailsModal
            device={device}
            isOpen={showDetails}
            onClose={() => {
              console.log('Closing modal for device:', device.device_id);
              setShowDetails(false);
              setIsModalOpening(false);
            }}
          />
        </ErrorBoundary>
      )}
    </div>
  );
};

export default DeviceCard;