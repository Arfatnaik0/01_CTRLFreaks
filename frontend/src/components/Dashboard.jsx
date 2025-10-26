import React, { useState, useEffect } from 'react';
import DeviceCard from './DeviceCard';
import StatsCard from './StatsCard';
import ChartCard from './ChartCard';
import { ApiService } from '../services/api';

const Dashboard = () => {
  const [devices, setDevices] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [latestReadings, setLatestReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState('all');
  const [turnedOffDevices, setTurnedOffDevices] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Helper function to get device status (same logic as DeviceCard)
  const getDeviceStatus = (device) => {
    const avgCurrent = device.avg_current || 0;
    const avgTemp = device.avg_temperature || 0;
    
    // Check if device is turned off (manually or by backend)
    if (turnedOffDevices.has(device.device_id) || device.relay_status === 'OFF' || avgCurrent === 0) {
      return 'turned-off';
    }
    
    // Check for critical conditions
    if (avgCurrent > 20 || avgTemp > 35) {
      return 'critical';
    }
    
    // Check for warning conditions
    if (avgCurrent > 15 || avgTemp > 30) {
      return 'warning';
    }
    
    return 'optimal';
  };

  // Filter devices based on selected status and search term
  const filteredDevices = devices.filter(device => {
    // Status filter
    const statusMatch = statusFilter === 'all' || getDeviceStatus(device) === statusFilter;
    
    // Search filter
    const searchMatch = searchTerm === '' || 
      device.device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.device_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    return statusMatch && searchMatch;
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [devicesResponse, analyticsResponse, readingsResponse] = await Promise.all([
        ApiService.getDeviceStatus(),
        ApiService.getAnalyticsOverview(),
        ApiService.getLatestReadings()
      ]);

      setDevices(devicesResponse.devices || []);
      setAnalytics(analyticsResponse.analytics || null);
      setLatestReadings(readingsResponse.readings || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchData();
  };

  const handleDeviceControl = async (deviceId, command, value) => {
    try {
      if (command === 'relay') {
        // Use the dedicated relay toggle API
        await ApiService.toggleRelay(deviceId, value);
        
        // Track manually turned off devices
        if (value === 'OFF') {
          setTurnedOffDevices(prev => new Set(prev).add(deviceId));
        } else if (value === 'ON') {
          setTurnedOffDevices(prev => {
            const newSet = new Set(prev);
            newSet.delete(deviceId);
            return newSet;
          });
        }
      } else {
        // Use the generic control API for other commands
        await ApiService.controlDevice(deviceId, command, value);
      }
      // Refresh data after control action
      setTimeout(fetchData, 1000);
    } catch (error) {
      console.error('Control action failed:', error);
      // You might want to show a toast notification here
    }
  };

  if (loading && devices.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-32"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl h-96"></div>
            <div className="bg-white rounded-xl h-96"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            Surveillance Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Real-time monitoring and control system
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
          >
            <svg 
              className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Show empty state if no devices exist at all */}
      {!loading && devices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-12 max-w-2xl w-full text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6">
              <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3">
              No Devices Connected
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-lg">
              Start the device simulator to see real-time data and monitor your IoT devices.
            </p>
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6 text-left space-y-3 mb-6">
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                To get started:
              </p>
              <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside">
                <li>Navigate to the simulator directory</li>
                <li>Run the device simulator script</li>
                <li>Watch your dashboard come alive with real-time data</li>
              </ol>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Check Again
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Active Devices"
                value={analytics.active_devices}
                icon="🏭"
                trend="+2.5%"
                trendUp={true}
                color="blue"
              />
              <StatsCard
                title="Avg Current"
                value={`${analytics.averages?.current?.toFixed(1) || 0}A`}
                icon="⚡"
                trend="+5.2%"
                trendUp={true}
                color="yellow"
              />
              <StatsCard
                title="Avg Temperature"
                value={`${analytics.averages?.temperature?.toFixed(1) || 0}°C`}
                icon="🌡️"
                trend="-1.3%"
                trendUp={false}
                color="red"
              />
              <StatsCard
                title="Active Alerts"
                value={Object.values(analytics.alert_counts || {}).reduce((a, b) => a + b, 0)}
                icon="⚠️"
                trend="0%"
                trendUp={false}
                color="red"
              />
            </div>
          )}

          {/* Charts and Recent Data */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Sensor Data Trends"
              data={latestReadings.slice(0, 20)}
              type="line"
            />
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
              <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                  Recent Sensor Readings
                </h2>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Latest data from your devices
                </p>
              </div>
              <div className="p-6 max-h-96 overflow-y-auto scrollbar-hide">
                <div className="space-y-3">
                  {latestReadings.slice(0, 8).map((reading, index) => (
                    <div 
                      key={reading.id || index}
                      className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {reading.device_id}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {reading.device_type}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {reading.current}A • {reading.temperature}°C
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(reading.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Device Cards */}
          <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            Device Status
          </h2>
          
          {/* Filter and Search Section */}
          <div className="flex items-center space-x-4">
            {/* Search Button and Input */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                title="Search devices"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              
              {showSearch && (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by device ID or type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600 dark:text-slate-400 mr-2">Filter by:</span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                statusFilter === 'all'
                  ? 'bg-slate-600 text-white border-slate-600'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              All ({devices.length})
            </button>
            <button
              onClick={() => setStatusFilter('warning')}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                statusFilter === 'warning'
                  ? 'bg-yellow-500 text-white border-yellow-500'
                  : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-600 hover:bg-yellow-200 dark:hover:bg-yellow-900/40'
              }`}
            >
              Warning ({devices.filter(d => getDeviceStatus(d) === 'warning').length})
            </button>
            <button
              onClick={() => setStatusFilter('critical')}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                statusFilter === 'critical'
                  ? 'bg-red-500 text-white border-red-500'
                  : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-600 hover:bg-red-200 dark:hover:bg-red-900/40'
              }`}
            >
              Critical ({devices.filter(d => getDeviceStatus(d) === 'critical').length})
            </button>
            <button
              onClick={() => setStatusFilter('turned-off')}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                statusFilter === 'turned-off'
                  ? 'bg-gray-500 text-white border-gray-500'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Turned Off ({devices.filter(d => getDeviceStatus(d) === 'turned-off').length})
            </button>
            </div>
          </div>
        </div>
        
        {filteredDevices.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
              No devices found
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
              {searchTerm ? (
                `No devices match "${searchTerm}"${statusFilter !== 'all' ? ` with ${statusFilter.replace('-', ' ')} status` : ''}`
              ) : (
                statusFilter === 'all' ? 'No devices available' : `No devices with ${statusFilter.replace('-', ' ')} status`
              )}
            </p>
            {(searchTerm || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="mt-3 px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDevices.map((device) => (
              <DeviceCard
                key={device.device_id}
                device={device}
                onControl={handleDeviceControl}
                isTurnedOff={turnedOffDevices.has(device.device_id)}
              />
            ))}
          </div>
        )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;