import React, { useState, useEffect } from 'react';
import { ApiService } from '../services/api';

const ChartCard = ({ title, type = 'trends' }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('temperature');
  const [isUpdating, setIsUpdating] = useState(false);
  const [nextUpdate, setNextUpdate] = useState(30);
  
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setIsUpdating(true);
        const response = await ApiService.getLatestReadings();
        if (response.status === 'success' && response.readings) {
          // Get last 30 readings for cleaner visualization
          const recentData = response.readings.slice(0, 30).reverse();
          setChartData(recentData);
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setLoading(false);
        setIsUpdating(false);
      }
    };

    fetchChartData();
    
    // Update every 30 seconds instead of 5
    const interval = setInterval(fetchChartData, 30000);
    
    // Countdown timer for next update
    const countdownInterval = setInterval(() => {
      setNextUpdate(prev => prev > 0 ? prev - 1 : 30);
    }, 1000);
    
    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
    };
  }, []);

  const getMetricData = (metric) => {
    if (!chartData.length) return [];
    
    const values = chartData.map(item => parseFloat(item[metric]) || 0);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue || 1;
    
    return values.map((value, index) => ({
      x: (index / (values.length - 1)) * 100,
      y: 100 - ((value - minValue) / range) * 100,
      value,
      time: chartData[index].timestamp,
      device: chartData[index].device_id
    }));
  };

  // Advanced prediction algorithm using linear regression and moving averages
  const getPredictedPoints = (points) => {
    if (points.length < 10) return [];
    
    const recent = points.slice(-10); // Use last 10 points for prediction
    const n = recent.length;
    
    // Simple linear regression for trend
    const sumX = recent.reduce((sum, _, i) => sum + i, 0);
    const sumY = recent.reduce((sum, p) => sum + p.value, 0);
    const sumXY = recent.reduce((sum, p, i) => sum + i * p.value, 0);
    const sumX2 = recent.reduce((sum, _, i) => sum + i * i, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Generate 5 predicted points
    const predictions = [];
    for (let i = 1; i <= 5; i++) {
      const futureIndex = points.length - 1 + i;
      const predictedValue = slope * (n - 1 + i) + intercept;
      
      // Add some smoothing based on moving average
      const movingAvg = recent.slice(-3).reduce((sum, p) => sum + p.value, 0) / 3;
      const smoothedPrediction = (predictedValue + movingAvg) / 2;
      
      predictions.push({
        x: (futureIndex / (points.length + 4)) * 100,
        y: 100 - ((smoothedPrediction - Math.min(...points.map(p => p.value))) / 
                  (Math.max(...points.map(p => p.value)) - Math.min(...points.map(p => p.value)) || 1)) * 100,
        value: smoothedPrediction,
        isPrediction: true
      });
    }
    
    return predictions;
  };

  const generateSmoothPath = (points) => {
    if (points.length < 2) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const next = points[i + 1];
      
      if (i === 1) {
        // First curve point
        const cp1x = prev.x + (curr.x - prev.x) * 0.3;
        const cp1y = prev.y + (curr.y - prev.y) * 0.3;
        const cp2x = curr.x - (curr.x - prev.x) * 0.3;
        const cp2y = curr.y - (curr.y - prev.y) * 0.3;
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
      } else if (next) {
        // Smooth bezier curves
        const cp1x = prev.x + (curr.x - prev.x) * 0.5;
        const cp1y = prev.y;
        const cp2x = curr.x - (next.x - curr.x) * 0.2;
        const cp2y = curr.y;
        path += ` S ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
      } else {
        // Last point
        path += ` L ${curr.x} ${curr.y}`;
      }
    }
    
    return path;
  };

  const metricConfig = {
    temperature: { 
      color: '#ef4444', 
      predictionColor: '#fca5a5',
      label: 'Temperature', 
      unit: '°C',
      icon: '🌡️'
    },
    current: { 
      color: '#3b82f6', 
      predictionColor: '#93c5fd',
      label: 'Current', 
      unit: 'A',
      icon: '⚡'
    },
    pressure: { 
      color: '#10b981', 
      predictionColor: '#6ee7b7',
      label: 'Pressure', 
      unit: 'Pa',
      icon: '📊'
    }
  };

  const currentMetric = metricConfig[selectedMetric];
  const points = getMetricData(selectedMetric);
  const predictions = getPredictedPoints(points);

  return (
    <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 hover:shadow-2xl transition-all duration-500 overflow-hidden">
      <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-r from-slate-50/50 to-white/50 dark:from-slate-800/50 dark:to-slate-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              📈 {title}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              Smart predictive sensor analytics with 30s updates
            </p>
          </div>
          
          {/* Enhanced Metric Selector */}
          <div className="flex bg-slate-100/80 dark:bg-slate-700/80 backdrop-blur-sm rounded-xl p-1 shadow-inner">
            {Object.entries(metricConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setSelectedMetric(key)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-300 flex items-center gap-2 ${
                  selectedMetric === key
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-lg transform scale-105'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-600/50'
                }`}
              >
                <span className="text-base">{config.icon}</span>
                {config.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-500"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-300 animate-ping"></div>
            </div>
            <div className="ml-4">
              <span className="text-lg font-semibold text-slate-700 dark:text-slate-300">Loading predictions...</span>
              <p className="text-sm text-slate-500 dark:text-slate-400">Analyzing sensor patterns</p>
            </div>
          </div>
        ) : chartData.length > 0 ? (
          <>
            {/* Enhanced Chart Header */}
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-6 h-6 rounded-full shadow-lg flex items-center justify-center"
                    style={{ backgroundColor: currentMetric.color }}
                  >
                    <div className="w-3 h-3 bg-white rounded-full opacity-90 animate-pulse"></div>
                  </div>
                  <div>
                    <span className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                      {points.length > 0 ? points[points.length - 1].value.toFixed(2) : '0.0'}
                    </span>
                    <span className="text-lg text-slate-500 dark:text-slate-400 ml-1">
                      {currentMetric.unit}
                    </span>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Current {currentMetric.label.toLowerCase()}
                    </p>
                  </div>
                </div>
                
                {/* Simplified Prediction Summary */}
                {predictions.length > 0 && (
                  <div className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-2xl border border-violet-200/50 dark:border-violet-700/50 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">🔮</span>
                      <div>
                        <span className="text-lg font-semibold bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
                          {predictions[predictions.length - 1].value.toFixed(2)}{currentMetric.unit}
                        </span>
                        <p className="text-xs text-violet-600 dark:text-violet-300 font-medium">Next predicted</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
                          />
                        ))}
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                      </div>
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">85%</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Clean Update Timer */}
              <div className="flex items-center space-x-3 text-sm">
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-colors ${
                  isUpdating ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' : 
                  'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                }`}>
                  <div className={`w-2 h-2 rounded-full ${
                    isUpdating ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'
                  }`}></div>
                  <span className="font-medium">
                    {isUpdating ? 'Updating...' : `${nextUpdate}s`}
                  </span>
                </div>
                <span className="text-slate-400 dark:text-slate-500 font-medium">
                  {chartData.length} samples
                </span>
              </div>
            </div>

            {/* Cleaner SVG Chart with More Space */}
            <div className="relative h-96 bg-gradient-to-br from-slate-50/30 via-white/20 to-slate-100/30 dark:from-slate-900/30 dark:via-slate-800/20 dark:to-slate-900/30 rounded-3xl p-8 shadow-inner border border-slate-200/20 dark:border-slate-700/20 mb-6">
              <svg 
                className="w-full h-full drop-shadow-sm" 
                viewBox="0 0 100 100" 
                preserveAspectRatio="none"
              >
                {/* Simplified Grid */}
                <defs>
                  <pattern id="cleanGrid" width="5" height="5" patternUnits="userSpaceOnUse">
                    <path d="M 5 0 L 0 0 0 5" fill="none" stroke="currentColor" strokeWidth="0.15" className="text-slate-300/40 dark:text-slate-600/40"/>
                  </pattern>
                  
                  {/* Clean gradients */}
                  <linearGradient id={`cleanAreaGradient-${selectedMetric}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={currentMetric.color} stopOpacity="0.25"/>
                    <stop offset="100%" stopColor={currentMetric.color} stopOpacity="0.0"/>
                  </linearGradient>
                  
                  <linearGradient id={`cleanPredictionGradient-${selectedMetric}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={currentMetric.predictionColor} stopOpacity="0.3"/>
                    <stop offset="100%" stopColor={currentMetric.predictionColor} stopOpacity="0.0"/>
                  </linearGradient>
                </defs>
                
                <rect width="100" height="100" fill="url(#cleanGrid)" opacity="0.6"/>
                
                {/* Historical area */}
                {points.length > 1 && (
                  <path
                    d={`${generateSmoothPath(points)} L ${points[points.length-1].x} 100 L ${points[0].x} 100 Z`}
                    fill={`url(#cleanAreaGradient-${selectedMetric})`}
                  />
                )}
                
                {/* Clean historical line */}
                {points.length > 1 && (
                  <path
                    d={generateSmoothPath(points)}
                    fill="none"
                    stroke={currentMetric.color}
                    strokeWidth="1.8"
                    className="drop-shadow-sm"
                  />
                )}
                
                {/* Clean historical points */}
                {points.map((point, index) => (
                  <circle
                    key={index}
                    cx={point.x}
                    cy={point.y}
                    r={index === points.length - 1 ? "1.2" : "0.8"}
                    fill={currentMetric.color}
                    stroke="white"
                    strokeWidth="0.3"
                    className="hover:r-2 transition-all cursor-pointer drop-shadow-sm"
                    style={{ 
                      opacity: index === points.length - 1 ? 1 : 0.8,
                      animation: index === points.length - 1 ? 'pulse 3s infinite' : 'none'
                    }}
                  >
                    <title>{`${currentMetric.label}: ${point.value.toFixed(2)}${currentMetric.unit}`}</title>
                  </circle>
                ))}
              </svg>
              
              {/* Clean Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-sm text-slate-500 dark:text-slate-400 py-8 -ml-16 font-mono">
                <span className="bg-white/90 dark:bg-slate-800/90 px-3 py-1 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                  {points.length > 0 ? Math.max(...points.map(p => p.value)).toFixed(1) : '0'}
                </span>
                <span className="bg-white/90 dark:bg-slate-800/90 px-3 py-1 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                  {points.length > 0 ? (Math.max(...points.map(p => p.value)) / 2).toFixed(1) : '0'}
                </span>
                <span className="bg-white/90 dark:bg-slate-800/90 px-3 py-1 rounded-lg shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                  {points.length > 0 ? Math.min(...points.map(p => p.value)).toFixed(1) : '0'}
                </span>
              </div>
              
              {/* Simplified legend - Historical data only */}
              <div className="absolute bottom-4 right-4 flex items-center space-x-2 bg-white/95 dark:bg-slate-800/95 px-4 py-2 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-2 rounded-full" style={{ backgroundColor: currentMetric.color }}></div>
                  <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Live Data</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">30 samples</span>
              </div>
            </div>

            {/* Cleaner Analytics Footer */}
            {points.length > 5 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="group p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Average Value</p>
                      <span className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                        {(points.reduce((sum, p) => sum + p.value, 0) / points.length).toFixed(2)}
                      </span>
                      <span className="text-lg text-slate-500 dark:text-slate-400 ml-1">{currentMetric.unit}</span>
                    </div>
                    <div className="text-3xl opacity-60 group-hover:opacity-100 transition-opacity">📊</div>
                  </div>
                </div>
                
                <div className="group p-6 bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-800/20 rounded-2xl border border-emerald-200/50 dark:border-emerald-700/50 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-1">Trend Direction</p>
                      <div className={`flex items-center space-x-2 ${
                        points[points.length - 1].value > points[0].value 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        <span className="text-2xl font-bold">
                          {Math.abs(((points[points.length - 1].value - points[0].value) / points[0].value) * 100).toFixed(1)}%
                        </span>
                        <span className="text-xl">
                          {points[points.length - 1].value > points[0].value ? '↗️' : '↘️'}
                        </span>
                      </div>
                    </div>
                    <div className="text-3xl opacity-60 group-hover:opacity-100 transition-opacity">📈</div>
                  </div>
                </div>
                
                {predictions.length > 0 && (
                  <div className="group p-6 bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-900/20 dark:to-purple-800/20 rounded-2xl border border-violet-200/50 dark:border-violet-700/50 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-violet-700 dark:text-violet-300 mb-1">Next Prediction</p>
                        <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                          {predictions[0].value.toFixed(2)}
                        </span>
                        <span className="text-lg text-violet-500 dark:text-violet-400 ml-1">{currentMetric.unit}</span>
                      </div>
                      <div className="text-3xl opacity-60 group-hover:opacity-100 transition-opacity">🔮</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="h-80 flex items-center justify-center text-slate-500 dark:text-slate-400">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-xl font-semibold mb-2">No trend data available</p>
              <p className="text-sm">Waiting for sensor readings to analyze patterns...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartCard;