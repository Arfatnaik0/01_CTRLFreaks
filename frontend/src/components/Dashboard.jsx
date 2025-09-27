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
            IoT Manufacturing Dashboard
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
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Device Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => (
            <DeviceCard
              key={device.device_id}
              device={device}
              onControl={handleDeviceControl}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;