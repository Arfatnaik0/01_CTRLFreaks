import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import { ApiService } from './services/api';
import { DeviceData, AnalyticsData } from './types';

function App() {
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [devicesResponse, analyticsResponse] = await Promise.all([
        ApiService.getDeviceStatus(),
        ApiService.getDashboardData()
      ]);

      setDevices(devicesResponse.devices || []);
      setAnalytics(analyticsResponse.data || null);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data from backend');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading IoT Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-6 rounded-lg shadow-lg">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64">
          <Dashboard 
            devices={devices} 
            analytics={analytics} 
            onRefresh={fetchData}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
