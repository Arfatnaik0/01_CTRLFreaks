import React from 'react';
import { Activity, Zap, TrendingUp, TrendingDown, Users, AlertCircle } from 'lucide-react';

const SystemMetrics = ({ stats = {}, detailed = false }) => {
  // Mock some data if stats are empty (for development)
  const mockStats = {
    total_devices: 33,
    active_devices: 31,
    total_alerts: 15,
    active_alerts: 3,
    total_energy_consumption: 2847.5,
    average_efficiency: 87.4,
    uptime_percentage: 99.2,
    data_points_today: 15420,
    anomalies_detected: 8,
    maintenance_due: 4
  };

  const currentStats = Object.keys(stats).length > 0 ? stats : mockStats;

  const getMetricCard = (title, value, icon, trend = null, color = 'blue') => {
    const colorMap = {
      blue: 'text-blue-400 bg-blue-500/20',
      green: 'text-green-400 bg-green-500/20',
      yellow: 'text-yellow-400 bg-yellow-500/20',
      red: 'text-red-400 bg-red-500/20',
      purple: 'text-purple-400 bg-purple-500/20'
    };

    return (
      <div className="bg-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-lg ${colorMap[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          {trend && (
            <div className={`flex items-center space-x-1 text-sm ${
              trend.direction === 'up' ? 'text-green-400' : trend.direction === 'down' ? 'text-red-400' : 'text-gray-400'
            }`}>
              {trend.direction === 'up' ? (
                <TrendingUp className="h-4 w-4" />
              ) : trend.direction === 'down' ? (
                <TrendingDown className="h-4 w-4" />
              ) : null}
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        
        <div>
          <h4 className="text-2xl font-bold text-white mb-1">{value}</h4>
          <p className="text-sm text-gray-400">{title}</p>
        </div>
      </div>
    );
  };

  const primaryMetrics = [
    {
      title: 'Total Devices',
      value: currentStats.total_devices || 0,
      icon: Users,
      color: 'blue',
      trend: { direction: 'stable', value: '+2 this month' }
    },
    {
      title: 'Active Devices',
      value: `${currentStats.active_devices || 0}/${currentStats.total_devices || 0}`,
      icon: Activity,
      color: 'green',
      trend: { direction: 'up', value: '98.4%' }
    },
    {
      title: 'Active Alerts',
      value: currentStats.active_alerts || 0,
      icon: AlertCircle,
      color: currentStats.active_alerts > 5 ? 'red' : currentStats.active_alerts > 0 ? 'yellow' : 'green',
      trend: { direction: 'down', value: '-2 from yesterday' }
    },
    {
      title: 'Energy Consumption',
      value: `${(currentStats.total_energy_consumption || 0).toFixed(1)} kWh`,
      icon: Zap,
      color: 'purple',
      trend: { direction: 'down', value: '-5.2% vs yesterday' }
    }
  ];

  const secondaryMetrics = detailed ? [
    {
      title: 'System Uptime',
      value: `${(currentStats.uptime_percentage || 0).toFixed(1)}%`,
      icon: Activity,
      color: 'green'
    },
    {
      title: 'Average Efficiency',
      value: `${(currentStats.average_efficiency || 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'blue'
    },
    {
      title: 'Data Points Today',
      value: (currentStats.data_points_today || 0).toLocaleString(),
      icon: Activity,
      color: 'purple'
    },
    {
      title: 'Anomalies Detected',
      value: currentStats.anomalies_detected || 0,
      icon: AlertCircle,
      color: 'yellow'
    },
    {
      title: 'Maintenance Due',
      value: currentStats.maintenance_due || 0,
      icon: Users,
      color: 'red'
    },
    {
      title: 'Total Alerts (All Time)',
      value: currentStats.total_alerts || 0,
      icon: AlertCircle,
      color: 'blue'
    }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Primary Metrics */}
      <div>
        {!detailed && (
          <h3 className="text-lg font-semibold text-white mb-4">System Overview</h3>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {primaryMetrics.map((metric, index) => (
            <div key={index}>
              {getMetricCard(metric.title, metric.value, metric.icon, metric.trend, metric.color)}
            </div>
          ))}
        </div>
      </div>

      {/* Secondary Metrics (detailed view only) */}
      {detailed && secondaryMetrics.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Detailed Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {secondaryMetrics.map((metric, index) => (
              <div key={index}>
                {getMetricCard(metric.title, metric.value, metric.icon, null, metric.color)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Health Indicators */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h4 className="text-md font-semibold text-white mb-4">System Health</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Overall Health */}
          <div className="text-center">
            <div className="mb-2">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
                (currentStats.active_alerts || 0) === 0 
                  ? 'bg-green-500/20 text-green-400' 
                  : (currentStats.active_alerts || 0) < 5 
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-red-500/20 text-red-400'
              }`}>
                <Activity className="h-8 w-8" />
              </div>
            </div>
            <h5 className="font-medium text-white">Overall Health</h5>
            <p className={`text-sm ${
              (currentStats.active_alerts || 0) === 0 
                ? 'text-green-400' 
                : (currentStats.active_alerts || 0) < 5 
                ? 'text-yellow-400'
                : 'text-red-400'
            }`}>
              {(currentStats.active_alerts || 0) === 0 
                ? 'Excellent' 
                : (currentStats.active_alerts || 0) < 5 
                ? 'Good'
                : 'Needs Attention'}
            </p>
          </div>

          {/* Network Status */}
          <div className="text-center">
            <div className="mb-2">
              <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-green-500/20 text-green-400">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            <h5 className="font-medium text-white">Network Status</h5>
            <p className="text-sm text-green-400">Online</p>
          </div>

          {/* Data Flow */}
          <div className="text-center">
            <div className="mb-2">
              <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center bg-blue-500/20 text-blue-400">
                <TrendingUp className="h-8 w-8" />
              </div>
            </div>
            <h5 className="font-medium text-white">Data Flow</h5>
            <p className="text-sm text-blue-400">Streaming</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemMetrics;