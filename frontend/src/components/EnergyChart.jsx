import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import axios from 'axios';
import { TrendingUp, BarChart3, PieChart, Calendar } from 'lucide-react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const API_BASE = 'http://localhost:5000/api';

const EnergyChart = () => {
  const [chartData, setChartData] = useState({});
  const [deviceTypeData, setDeviceTypeData] = useState({});
  const [activeChart, setActiveChart] = useState('energy');
  const [timeRange, setTimeRange] = useState('24h');
  const [loading, setLoading] = useState(true);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        labels: {
          color: '#9CA3AF'
        }
      },
      tooltip: {
        backgroundColor: '#1F2937',
        titleColor: '#F9FAFB',
        bodyColor: '#D1D5DB',
        borderColor: '#374151',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#9CA3AF'
        },
        grid: {
          color: '#374151'
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        ticks: {
          color: '#9CA3AF'
        },
        grid: {
          color: '#374151'
        },
        title: {
          display: true,
          text: 'Energy (kWh)',
          color: '#9CA3AF'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        ticks: {
          color: '#9CA3AF'
        },
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Current (A)',
          color: '#9CA3AF'
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#9CA3AF',
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: '#1F2937',
        titleColor: '#F9FAFB',
        bodyColor: '#D1D5DB',
        borderColor: '#374151',
        borderWidth: 1
      }
    }
  };

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        // Fetch real data from API
        const response = await axios.get(`${API_BASE}/energy-data?hours=${timeRange.replace(/[^0-9]/g, '') || '24'}`);
        const data = response.data;

        if (data.error) {
          console.error('API Error:', data.error);
          // Fall back to mock data
          setChartData(getMockEnergyData());
        } else {
          // Use real data
          const realEnergyData = {
            labels: data.labels || [],
            datasets: [
              {
                label: 'Energy Consumption (kWh)',
                data: data.energy_data || [],
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4
              },
              {
                label: 'Current (A)',
                data: data.current_data || [],
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: false,
                yAxisID: 'y1',
                tension: 0.4
              }
            ]
          };
          setChartData(realEnergyData);
        }

        const mockDeviceData = {
          labels: ['Motors', 'HVAC', 'Pumps', 'Lighting', 'Compressors', 'Other'],
          datasets: [{
            data: [35, 25, 20, 10, 7, 3],
            backgroundColor: [
              '#3B82F6',
              '#10B981',
              '#8B5CF6',
              '#F59E0B',
              '#EF4444',
              '#6B7280'
            ],
            borderWidth: 0
          }]
        };

        setDeviceTypeData(mockDeviceData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching chart data:', error);
        // Fall back to mock data
        setChartData(getMockEnergyData());
        setLoading(false);
      }
    };

    const getMockEnergyData = () => ({
      labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
      datasets: [
        {
          label: 'Energy Consumption (kWh)',
          data: Array.from({ length: 24 }, () => Math.random() * 100 + 50),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Predicted Consumption',
          data: Array.from({ length: 24 }, () => Math.random() * 80 + 40),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: false,
          borderDash: [5, 5],
          tension: 0.4
        }
      ]
    });

    fetchChartData();
    const interval = setInterval(fetchChartData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [timeRange]);

  const chartTypes = [
    { id: 'energy', label: 'Energy Trends', icon: TrendingUp },
    { id: 'consumption', label: 'Device Usage', icon: BarChart3 },
    { id: 'distribution', label: 'Distribution', icon: PieChart }
  ];

  const timeRanges = [
    { id: '1h', label: '1 Hour' },
    { id: '24h', label: '24 Hours' },
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' }
  ];

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const renderChart = () => {
    switch (activeChart) {
      case 'energy':
        return (
          <div className="h-64">
            <Line data={chartData} options={chartOptions} />
          </div>
        );
      case 'consumption':
        const barData = {
          ...chartData,
          datasets: [{
            ...chartData.datasets[0],
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: '#3B82F6',
            borderWidth: 1
          }]
        };
        return (
          <div className="h-64">
            <Bar data={barData} options={chartOptions} />
          </div>
        );
      case 'distribution':
        return (
          <div className="h-64">
            <Doughnut data={deviceTypeData} options={doughnutOptions} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h3 className="text-lg font-semibold text-white">Energy Analytics</h3>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          {/* Time Range Selector */}
          <div className="flex space-x-2">
            <Calendar className="h-5 w-5 text-gray-400 mt-1" />
            <div className="flex space-x-1">
              {timeRanges.map((range) => (
                <button
                  key={range.id}
                  onClick={() => setTimeRange(range.id)}
                  className={`px-3 py-1 text-sm rounded ${
                    timeRange === range.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chart Type Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-700 p-1 rounded-lg">
        {chartTypes.map((chart) => {
          const IconComponent = chart.icon;
          return (
            <button
              key={chart.id}
              onClick={() => setActiveChart(chart.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeChart === chart.id
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-600'
              }`}
            >
              <IconComponent className="h-4 w-4" />
              <span>{chart.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <div className="relative">
        {renderChart()}
      </div>

      {/* Chart Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-700">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">2,847</div>
          <div className="text-sm text-gray-400">Total kWh</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">-5.2%</div>
          <div className="text-sm text-gray-400">vs Yesterday</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">87.4%</div>
          <div className="text-sm text-gray-400">Efficiency</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">$341</div>
          <div className="text-sm text-gray-400">Est. Cost</div>
        </div>
      </div>
    </div>
  );
};

export default EnergyChart;