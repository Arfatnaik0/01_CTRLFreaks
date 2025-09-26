import React, { useState } from 'react';
import { Power, Settings, AlertTriangle, Play, Pause, RotateCcw, Wrench } from 'lucide-react';

const ControlPanel = ({ devices = [] }) => {
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const toggleDeviceSelection = (deviceId) => {
    setSelectedDevices(prev => 
      prev.includes(deviceId) 
        ? prev.filter(id => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  const handleBulkAction = (action) => {
    if (selectedDevices.length === 0) return;
    
    setPendingAction(action);
    setShowConfirmDialog(true);
  };

  const confirmAction = async () => {
    // Here you would make API calls to control the devices
    console.log(`Executing ${pendingAction} on devices:`, selectedDevices);
    
    // Mock API call
    try {
      // await axios.post(`${API_BASE}/devices/control`, {
      //   device_ids: selectedDevices,
      //   action: pendingAction
      // });
      
      // For demo, just log the action
      alert(`${pendingAction} action executed on ${selectedDevices.length} device(s)`);
      
    } catch (error) {
      console.error('Error executing device control:', error);
      alert('Error executing action');
    }
    
    setShowConfirmDialog(false);
    setPendingAction(null);
    setSelectedDevices([]);
  };

  const getDeviceStatusColor = (status) => {
    const colorMap = {
      active: 'text-green-400 bg-green-500/20',
      maintenance: 'text-yellow-400 bg-yellow-500/20',
      inactive: 'text-red-400 bg-red-500/20'
    };
    return colorMap[status] || 'text-gray-400 bg-gray-500/20';
  };

  const getActionIcon = (action) => {
    const iconMap = {
      start: Play,
      stop: Pause,
      restart: RotateCcw,
      maintenance: Wrench,
      emergency_stop: AlertTriangle
    };
    return iconMap[action] || Settings;
  };

  const controlActions = [
    { id: 'start', label: 'Start', color: 'bg-green-500 hover:bg-green-600', icon: Play },
    { id: 'stop', label: 'Stop', color: 'bg-red-500 hover:bg-red-600', icon: Pause },
    { id: 'restart', label: 'Restart', color: 'bg-blue-500 hover:bg-blue-600', icon: RotateCcw },
    { id: 'maintenance', label: 'Maintenance', color: 'bg-yellow-500 hover:bg-yellow-600', icon: Wrench }
  ];

  return (
    <div className="space-y-6">
      {/* Control Header */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Device Control Panel</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Power className="h-4 w-4" />
            <span>Remote Control Enabled</span>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="flex flex-wrap gap-3 mb-4">
          {controlActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleBulkAction(action.id)}
                disabled={selectedDevices.length === 0}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${action.color}`}
              >
                <IconComponent className="h-4 w-4" />
                <span>{action.label} Selected ({selectedDevices.length})</span>
              </button>
            );
          })}
        </div>

        {/* Emergency Stop */}
        <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-400" />
              <div>
                <h4 className="font-medium text-red-400">Emergency Controls</h4>
                <p className="text-sm text-red-300">Immediate shutdown for safety</p>
              </div>
            </div>
            <button
              onClick={() => handleBulkAction('emergency_stop')}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md font-medium flex items-center space-x-2"
            >
              <AlertTriangle className="h-4 w-4" />
              <span>Emergency Stop All</span>
            </button>
          </div>
        </div>
      </div>

      {/* Device List */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-md font-semibold text-white">Device Control ({devices.length} devices)</h4>
          <div className="flex items-center space-x-4 text-sm">
            <label className="flex items-center space-x-2 text-gray-400">
              <input
                type="checkbox"
                checked={selectedDevices.length === devices.length && devices.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedDevices(devices.map(d => d.device_id));
                  } else {
                    setSelectedDevices([]);
                  }
                }}
                className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
              />
              <span>Select All</span>
            </label>
            <span className="text-gray-500">
              {selectedDevices.length} selected
            </span>
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {devices.map((device) => (
            <div
              key={device.device_id}
              className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                selectedDevices.includes(device.device_id)
                  ? 'bg-blue-500/20 border-blue-500/50'
                  : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  checked={selectedDevices.includes(device.device_id)}
                  onChange={() => toggleDeviceSelection(device.device_id)}
                  className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                />
                
                <div>
                  <h5 className="font-medium text-white">{device.device_id}</h5>
                  <p className="text-sm text-gray-400">{device.location}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right text-sm">
                  <div className="text-gray-400">Type: {device.device_type}</div>
                  <div className="text-gray-500">{device.manufacturer}</div>
                </div>
                
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getDeviceStatusColor(device.status)}`}>
                  {device.status}
                </div>

                <div className="flex space-x-2">
                  {controlActions.slice(0, 3).map((action) => {
                    const IconComponent = action.icon;
                    return (
                      <button
                        key={action.id}
                        onClick={() => {
                          setSelectedDevices([device.device_id]);
                          handleBulkAction(action.id);
                        }}
                        className="p-2 rounded-md bg-gray-600 hover:bg-gray-500 text-gray-300 hover:text-white transition-colors"
                        title={action.label}
                      >
                        <IconComponent className="h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {devices.length === 0 && (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No devices available for control</p>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-400" />
              <h3 className="text-lg font-semibold text-white">Confirm Action</h3>
            </div>
            
            <p className="text-gray-300 mb-6">
              Are you sure you want to <span className="font-medium text-white">{pendingAction}</span> the following {selectedDevices.length} device(s)?
            </p>
            
            <div className="bg-gray-700 rounded-md p-3 mb-6 max-h-32 overflow-y-auto">
              {selectedDevices.map(deviceId => (
                <div key={deviceId} className="text-sm text-gray-300">{deviceId}</div>
              ))}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setPendingAction(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`flex-1 px-4 py-2 rounded-md font-medium text-white ${
                  pendingAction === 'emergency_stop'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Confirm {pendingAction}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;