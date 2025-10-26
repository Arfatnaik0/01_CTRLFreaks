import React, { useState, useEffect, useContext } from 'react';
import { ApiService } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';

const Header = () => {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [systemHealth, setSystemHealth] = useState(null);
  const [systemOnline, setSystemOnline] = useState(false);
  const { user, logout } = useContext(AuthContext);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const [health, systemStatus] = await Promise.all([
          ApiService.getHealth(),
          ApiService.getSystemStatus()
        ]);
        setSystemHealth(health);
        setSystemOnline(systemStatus.system_online);
        setConnectionStatus('connected');
      } catch (error) {
        setConnectionStatus('disconnected');
        setSystemOnline(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (connectionStatus !== 'connected') return 'bg-red-500';
    return systemOnline ? 'bg-green-500' : 'bg-gray-500';
  };

  const getStatusText = () => {
    if (connectionStatus !== 'connected') return 'System Offline';
    return systemOnline ? 'System Online' : 'System Offline';
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  IoT Control Center
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Manufacturing Plant Monitor
                </p>
              </div>
            </div>
          </div>

          {/* Status and Controls */}
          <div className="flex items-center space-x-6">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`}></div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {getStatusText()}
              </span>
            </div>

            {/* System Health */}
            {systemHealth && (
              <div className="hidden md:flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <span className="text-slate-500">Database:</span>
                  <span className={`font-medium ${systemHealth.database === 'healthy' ? 'text-green-600' : 'text-red-600'}`}>
                    {systemHealth.database}
                  </span>
                </div>
              </div>
            )}

            {/* User Info and Logout */}
            {user && (
              <div className="flex items-center space-x-4">
                <div className="hidden sm:block text-sm">
                  <span className="font-medium text-slate-700"></span>
                  {user.role && (
                    <span className="ml-2 text-xs px-2 py-1 bg-blue-100/80 backdrop-blur-sm text-blue-700 rounded-full border border-blue-200/50">
                      {user.role}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 ml-1.5 text-sm bg-white/50 backdrop-blur-sm hover:bg-white/70 border border-gray-200/50 rounded-lg transition-all duration-200 shadow-sm"
                  title="Logout"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline text-gray-700">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;