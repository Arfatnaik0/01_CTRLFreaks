import React from 'react';

const StatsCard = ({ title, value, icon, trend, trendUp, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/10 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400',
    green: 'bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400'
  };

  const trendColorClasses = trendUp 
    ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20'
    : 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className={`p-2 rounded-lg text-xl ${colorClasses[color]}`}>
              {icon}
            </div>
            <h3 className="text-slate-600 dark:text-slate-400 font-medium text-sm">
              {title}
            </h3>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">
              {value}
            </div>
            
            {trend && (
              <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${trendColorClasses}`}>
                <svg 
                  className={`w-3 h-3 mr-1 ${trendUp ? '' : 'rotate-180'}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 14l9-9 9 9" />
                </svg>
                {trend}
              </div>
            )}
          </div>
        </div>
        
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {color === 'blue' && (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            )}
            {color === 'yellow' && (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            )}
            {color === 'red' && (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            )}
            {color === 'green' && (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default StatsCard;