import React from 'react';
import { Cpu, Thermometer, Zap, Gauge, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const DeviceGrid = ({ devices = [], compact = false }) => {
  const getDeviceIcon = (deviceType) => {
    const iconMap = {
      motor: Zap,
      hvac: Thermometer,
      pump: Gauge,
      lighting: Cpu,
      compressor: Gauge,
      conveyor: Cpu,
      sensor: Thermometer,
      welding: Zap,
      robot: Cpu
    };
    return iconMap[deviceType] || Cpu;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      active: 'bg-green-500',
      maintenance: 'bg-yellow-500',
      inactive: 'bg-red-500',
      warning: 'bg-orange-500'
    };
    return colorMap[status] || 'bg-gray-500';
  };

  const getDeviceTypeColor = (deviceType) => {
    const colorMap = {
      motor: 'bg-blue-500',
      hvac: 'bg-green-500',
      pump: 'bg-purple-500',
      lighting: 'bg-yellow-500',
      compressor: 'bg-red-500',
      conveyor: 'bg-indigo-500',
      sensor: 'bg-pink-500',
      welding: 'bg-orange-500',
      robot: 'bg-teal-500'
    };
    return colorMap[deviceType] || 'bg-gray-500';
  };

  if (!devices.length) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Devices</h3>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Cpu className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">No devices available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">
          Devices ({devices.length})
        </h3>
        {!compact && (
          <div className="flex space-x-2 text-sm">
            <span className="flex items-center space-x-1 text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Active</span>
            </span>
            <span className="flex items-center space-x-1 text-yellow-400">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Maintenance</span>
            </span>
            <span className="flex items-center space-x-1 text-red-400">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Alert</span>
            </span>
          </div>
        )}
      </div>

      <div className={`grid gap-4 ${
        compact ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      }`}>
        {devices.map((device) => {
          const IconComponent = getDeviceIcon(device.device_type);
          
          return (
            <div
              key={device.device_id}
              className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors cursor-pointer border border-gray-600 hover:border-gray-500"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${getDeviceTypeColor(device.device_type)}`}>
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
                <div className={`w-3 h-3 rounded-full ${getStatusColor(device.status)}`}></div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-white truncate" title={device.device_id}>
                  {device.device_id}
                </h4>
                <p className="text-sm text-gray-400 truncate" title={device.location}>
                  {device.location}
                </p>
                
                {!compact && (
                  <>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span className="capitalize">{device.device_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Model:</span>
                        <span className="truncate ml-2" title={device.model}>{device.model}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-600">
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="text-gray-400">Current</div>
                          <div className="text-blue-400 font-medium">{device.max_current}A</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-400">Temp</div>
                          <div className="text-orange-400 font-medium">{device.max_temperature}°C</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-400">Press</div>
                          <div className="text-green-400 font-medium">{device.max_pressure}bar</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between pt-2">
                  <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                    device.status === 'active' 
                      ? 'bg-green-500/20 text-green-400'
                      : device.status === 'maintenance'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {device.status}
                  </span>
                  
                  {compact && (
                    <div className="flex space-x-1 text-xs text-gray-400">
                      <span>{device.max_current}A</span>
                      <span>•</span>
                      <span>{device.max_temperature}°C</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {compact && devices.length > 12 && (
        <div className="mt-4 text-center">
          <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
            View All Devices ({devices.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default DeviceGrid;