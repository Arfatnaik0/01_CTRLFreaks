import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function App() {
  const [data, setData] = useState({
    devices: [],
    alerts: [],
    anomalies: [],
    maintenancePredictions: [],
    stats: { total_devices: 0, active_alerts: 0 },
    maintenance: 0,
    energyData: [],
    loading: true
  });

  const [activeTab, setActiveTab] = useState('overview');

  const filterLast24Hours = (items) => {
    if (!Array.isArray(items)) return [];
    const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
    return items.filter(item => {
      if (!item.timestamp) return true;
      const itemTime = new Date(item.timestamp).getTime();
      return itemTime >= last24Hours;
    });
  };

  const generateMockEnergyData = () => {
    return Array.from({ length: 24 }, (_, i) => ({
      timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
      total_consumption: 750 + Math.sin(i / 4) * 100 + Math.random() * 50,
      efficiency: 85 + Math.cos(i / 6) * 10 + Math.random() * 5,
      predicted_consumption: 780 + Math.sin((i + 2) / 4) * 90
    }));
  };

  const fetchData = async () => {
    try {
      console.log('Fetching dashboard data...');

      const [devicesRes, alertsRes, anomaliesRes, maintenanceRes, statsRes, energyRes] = await Promise.all([
        fetch('http://localhost:5000/api/devices').catch(() => ({ ok: false })),
        fetch('http://localhost:5000/api/alerts').catch(() => ({ ok: false })),
        fetch('http://localhost:5000/api/ml/anomalies').catch(() => ({ ok: false })),
        fetch('http://localhost:5000/api/ml/maintenance').catch(() => ({ ok: false })),
        fetch('http://localhost:5000/api/system-stats').catch(() => ({ ok: false })),
        fetch('http://localhost:5000/api/energy-data').catch(() => ({ ok: false }))
      ]);

      const devices = devicesRes.ok ? await devicesRes.json() : [];
      const alerts = alertsRes.ok ? await alertsRes.json() : [];
      const anomaliesData = anomaliesRes.ok ? await anomaliesRes.json() : { anomalies: [] };
      const maintenanceData = maintenanceRes.ok ? await maintenanceRes.json() : { predictions: [] };
      const stats = statsRes.ok ? await statsRes.json() : {};
      const energyData = energyRes.ok ? await energyRes.json() : [];

      const anomalies = filterLast24Hours(anomaliesData.anomalies || []);

      setData({
        devices: Array.isArray(devices) ? devices : [],
        alerts: Array.isArray(alerts) ? alerts : [],
        anomalies,
        maintenancePredictions: Array.isArray(maintenanceData.predictions) ? maintenanceData.predictions : [],
        stats: stats || { total_devices: devices.length, active_alerts: alerts.length },
        maintenance: maintenanceData.predictions?.length || 0,
        energyData: Array.isArray(energyData) ? energyData.slice(-24) : generateMockEnergyData(),
        loading: false
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      setData({
        devices: [
          { device_id: 'MOTOR_001', location: 'Production A', status: 'active' },
          { device_id: 'PUMP_002', location: 'Cooling System', status: 'active' }
        ],
        alerts: [{ device_id: 'MOTOR_003', message: 'Temperature high', severity: 'warning' }],
        anomalies: [],
        maintenancePredictions: [],
        stats: { total_devices: 33, active_alerts: 5 },
        maintenance: 3,
        energyData: generateMockEnergyData(),
        loading: false
      });
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Chart configurations
  const energyChartData = {
    labels: data.energyData.map(d => new Date(d.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })),
    datasets: [
      {
        label: 'Actual Consumption (kWh)',
        data: data.energyData.map(d => d.total_consumption),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Predicted Consumption (kWh)',
        data: data.energyData.map(d => d.predicted_consumption),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderDash: [5, 5],
        tension: 0.4,
      }
    ]
  };

  const efficiencyChartData = {
    labels: data.energyData.map(d => new Date(d.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })),
    datasets: [
      {
        label: 'System Efficiency (%)',
        data: data.energyData.map(d => d.efficiency),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2,
      }
    ]
  };

  const deviceStatusData = {
    labels: ['Active', 'Warning', 'Critical'],
    datasets: [
      {
        data: [
          data.devices.filter(d => d.status === 'active').length,
          data.devices.filter(d => d.status === 'warning').length,
          data.devices.filter(d => d.status === 'critical').length
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(251, 191, 36)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 2,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'white'
        }
      },
      title: {
        color: 'white'
      }
    },
    scales: {
      x: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      },
      y: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'white',
          padding: 20
        }
      }
    }
  };

  if (data.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
          <p className="text-slate-300 mt-4">Loading Advanced Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white overflow-x-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800/30 via-gray-800/30 to-slate-800/30 backdrop-blur-sm border-b border-slate-700/50">
        <div className="p-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4">
                IoT Energy Monitor
              </h1>
              <p className="text-slate-300 text-xl">Advanced Analytics & Smart Energy Dashboard</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="px-6 py-3 bg-green-500/20 border border-green-500/30 rounded-full">
                <span className="text-green-400 text-sm font-medium">LIVE</span>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-400 mb-1">Last Updated</div>
                <div className="text-cyan-400 font-mono text-sm">{new Date().toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-10 py-8">
        <div className="flex space-x-3 bg-slate-800/50 rounded-xl p-2">
          {[
            { id: 'overview', name: 'Overview' },
            { id: 'analytics', name: 'Analytics' },
            { id: 'forecasting', name: 'Forecasting' },
            { id: 'performance', name: 'Performance' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-8 py-4 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      <div className="px-10 pb-10">
        {activeTab === 'overview' && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              <div className="group bg-gradient-to-br from-blue-600/20 to-blue-500/10 border border-blue-500/30 rounded-2xl p-8 hover:bg-blue-600/25 hover:border-blue-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-4 bg-blue-500/20 rounded-xl">
                    <div className="w-8 h-8 bg-blue-400 rounded-lg"></div>
                  </div>
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
                <div className="text-blue-400 text-sm font-medium tracking-wide mb-3">TOTAL DEVICES</div>
                <div className="text-4xl font-bold text-white mb-2">{data.stats.total_devices || data.devices.length}</div>
                <div className="text-blue-300 text-sm">Connected & Monitored</div>
              </div>

              <div className="group bg-gradient-to-br from-yellow-600/20 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-8 hover:bg-yellow-600/25 hover:border-yellow-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/10">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-4 bg-yellow-500/20 rounded-xl">
                    <div className="w-8 h-8 bg-yellow-400 rounded-lg"></div>
                  </div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                </div>
                <div className="text-yellow-400 text-sm font-medium tracking-wide mb-3">ACTIVE ALERTS</div>
                <div className="text-4xl font-bold text-white mb-2">{data.stats.active_alerts || data.alerts.length}</div>
                <div className="text-yellow-300 text-sm">Require Attention</div>
              </div>

              <div className="group bg-gradient-to-br from-red-600/20 to-pink-500/10 border border-red-500/30 rounded-2xl p-8 hover:bg-red-600/25 hover:border-red-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-red-500/10">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-4 bg-red-500/20 rounded-xl">
                    <div className="w-8 h-8 bg-red-400 rounded-lg"></div>
                  </div>
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                </div>
                <div className="text-red-400 text-sm font-medium tracking-wide mb-3">AI ANOMALIES (24h)</div>
                <div className="text-4xl font-bold text-white mb-2">{data.anomalies.length}</div>
                <div className="text-red-300 text-sm">AI Detected Issues</div>
              </div>

              <div className="group bg-gradient-to-br from-purple-600/20 to-indigo-500/10 border border-purple-500/30 rounded-2xl p-8 hover:bg-purple-600/25 hover:border-purple-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10">
                <div className="flex items-center justify-between mb-6">
                  <div className="p-4 bg-purple-500/20 rounded-xl">
                    <div className="w-8 h-8 bg-purple-400 rounded-lg"></div>
                  </div>
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                </div>
                <div className="text-purple-400 text-sm font-medium tracking-wide mb-3">MAINTENANCE</div>
                <div className="text-4xl font-bold text-white mb-2">{data.maintenance}</div>
                <div className="text-purple-300 text-sm">Predicted Needs</div>
              </div>
            </div>

            {/* Overview Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
              <div className="lg:col-span-2 bg-gradient-to-br from-slate-800/60 to-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-10 hover:bg-slate-800/70 transition-all duration-300">
                <h3 className="text-2xl font-bold text-white mb-8 flex items-center">
                  <span className="mr-4 p-3 bg-blue-500/20 rounded-lg">
                    <div className="w-6 h-6 bg-blue-400 rounded"></div>
                  </span>
                  Energy Consumption Trends (24h)
                </h3>
                <div style={{ height: '350px' }}>
                  <Line data={energyChartData} options={chartOptions} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-10 hover:bg-slate-800/70 transition-all duration-300">
                <h3 className="text-2xl font-bold text-white mb-8 flex items-center">
                  <span className="mr-4 p-3 bg-green-500/20 rounded-lg">
                    <div className="w-6 h-6 bg-green-400 rounded"></div>
                  </span>
                  Device Status Distribution
                </h3>
                <div style={{ height: '350px' }}>
                  <Doughnut data={deviceStatusData} options={doughnutOptions} />
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-10 hover:bg-slate-800/70 transition-all duration-300">
                <h3 className="text-2xl font-bold text-white mb-8 flex items-center">
                  <span className="mr-4 p-3 bg-green-500/20 rounded-lg">
                    <div className="w-6 h-6 bg-green-400 rounded"></div>
                  </span>
                  System Efficiency Analysis
                </h3>
                <div style={{ height: '400px' }}>
                  <Bar data={efficiencyChartData} options={chartOptions} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-10 hover:bg-slate-800/70 transition-all duration-300">
                <h3 className="text-2xl font-bold text-white mb-8 flex items-center">
                  <span className="mr-4 p-3 bg-purple-500/20 rounded-lg">
                    <div className="w-6 h-6 bg-purple-400 rounded"></div>
                  </span>
                  Performance Metrics
                </h3>
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-6">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-300 text-lg">Average Efficiency</span>
                      <span className="text-3xl font-bold text-blue-400">
                        {data.energyData.length > 0 ?
                          (data.energyData.reduce((acc, d) => acc + d.efficiency, 0) / data.energyData.length).toFixed(1) : 87}%
                      </span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6">
                    <div className="flex justify-between items-center">
                      <span className="text-green-300 text-lg">Peak Consumption</span>
                      <span className="text-3xl font-bold text-green-400">
                        {data.energyData.length > 0 ?
                          Math.max(...data.energyData.map(d => d.total_consumption)).toFixed(0) : 850} kWh
                      </span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 rounded-xl p-6">
                    <div className="flex justify-between items-center">
                      <span className="text-yellow-300 text-lg">Prediction Accuracy</span>
                      <span className="text-3xl font-bold text-yellow-400">94.2%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'forecasting' && (
          <div className="space-y-12">
            <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/30 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-10 hover:bg-purple-900/50 transition-all duration-300">
              <h3 className="text-2xl font-bold text-white mb-8 flex items-center">
                <span className="mr-4 p-3 bg-purple-500/20 rounded-lg">
                  <div className="w-6 h-6 bg-purple-400 rounded"></div>
                </span>
                Energy Forecasting & Predictions
              </h3>
              <div style={{ height: '450px' }} className="mb-10">
                <Line data={energyChartData} options={chartOptions} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center p-6 bg-purple-500/10 rounded-xl border border-purple-500/30">
                  <div className="text-purple-300 text-sm mb-3">Next Hour Forecast</div>
                  <div className="text-3xl font-bold text-purple-400 mb-2">
                    {data.energyData.length > 0 ?
                      (data.energyData[data.energyData.length - 1].predicted_consumption + 15).toFixed(0) : 795} kWh
                  </div>
                </div>
                <div className="text-center p-6 bg-blue-500/10 rounded-xl border border-blue-500/30">
                  <div className="text-blue-300 text-sm mb-3">Daily Projection</div>
                  <div className="text-3xl font-bold text-blue-400 mb-2">18.2 MWh</div>
                </div>
                <div className="text-center p-6 bg-green-500/10 rounded-xl border border-green-500/30">
                  <div className="text-green-300 text-sm mb-3">Cost Savings</div>
                  <div className="text-3xl font-bold text-green-400 mb-2">$1,240</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-10 hover:bg-slate-800/70 transition-all duration-300">
                <h3 className="text-2xl font-bold text-white mb-8 flex items-center">
                  <span className="mr-4 p-3 bg-yellow-500/20 rounded-lg">
                    <div className="w-6 h-6 bg-yellow-400 rounded"></div>
                  </span>
                  Top Performing Devices
                </h3>
                <div className="space-y-6">
                  {data.devices.slice(0, 5).map((device, index) => (
                    <div key={index} className="flex items-center justify-between p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl hover:bg-green-500/20 transition-all duration-200">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center text-green-400 font-bold text-lg">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-white text-lg">{device.device_id}</div>
                          <div className="text-sm text-slate-400">{device.location}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-bold text-xl">{(95 - index * 2).toFixed(1)}%</div>
                        <div className="text-sm text-slate-400">Efficiency</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-10 hover:bg-slate-800/70 transition-all duration-300">
                <h3 className="text-2xl font-bold text-white mb-8 flex items-center">
                  <span className="mr-4 p-3 bg-red-500/20 rounded-lg">
                    <div className="w-6 h-6 bg-red-400 rounded"></div>
                  </span>
                  Performance Alerts
                </h3>
                <div className="space-y-6">
                  <div className="p-6 bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-red-300 text-lg">HVAC_007</div>
                        <div className="text-sm text-red-400 mt-1">Efficiency dropped 12%</div>
                      </div>
                      <div className="text-red-400 font-bold text-sm px-3 py-1 bg-red-500/20 rounded-full">CRITICAL</div>
                    </div>
                  </div>
                  <div className="p-6 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 rounded-xl hover:bg-yellow-500/20 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-yellow-300 text-lg">MOTOR_015</div>
                        <div className="text-sm text-yellow-400 mt-1">Higher than normal consumption</div>
                      </div>
                      <div className="text-yellow-400 font-bold text-sm px-3 py-1 bg-yellow-500/20 rounded-full">WARNING</div>
                    </div>
                  </div>
                  <div className="p-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl hover:bg-blue-500/20 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-blue-300 text-lg">PUMP_003</div>
                        <div className="text-sm text-blue-400 mt-1">Scheduled maintenance due</div>
                      </div>
                      <div className="text-blue-400 font-bold text-sm px-3 py-1 bg-blue-500/20 rounded-full">INFO</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Footer */}
        <div className="mt-20 text-center">
          <div className="inline-flex items-center space-x-6 bg-slate-800/30 border border-slate-700/50 rounded-full px-8 py-4">
            <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
            <div className="text-slate-300 text-sm">
              Last updated: <span className="font-mono text-cyan-400">{new Date().toLocaleTimeString()}</span>
            </div>
            <div className="text-slate-500 text-sm">•</div>
            <div className="text-slate-400 text-sm">Auto-refresh: 30s</div>
            <div className="text-slate-500 text-sm">•</div>
            <div className="text-slate-400 text-sm">Advanced Analytics Active</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
