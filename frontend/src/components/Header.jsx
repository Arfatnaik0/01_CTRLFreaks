import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';

const Header = ({ onToggleDarkMode, darkMode }) => {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [systemHealth, setSystemHealth] = useState(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const health = await ApiService.getHealth();
        setSystemHealth(health);
        setConnectionStatus('connected');
      } catch (error) {
        setConnectionStatus('disconnected');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'System Online';
      case 'disconnected': return 'System Offline';
      default: return 'Checking...';
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
                  <span className="text-slate-500 dark:text-slate-400">Database:</span>
                  <span className={`font-medium ${systemHealth.database === 'healthy' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {systemHealth.database}
                  </span>
                </div>
              </div>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors duration-200"
              title="Toggle dark mode"
            >
              {darkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* User Menu */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                A
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;