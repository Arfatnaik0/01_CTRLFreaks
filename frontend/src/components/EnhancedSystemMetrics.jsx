import React, { useState, useEffect } from 'react';import React, { useState, useEffect } from 'react';import React, { useState, useEffect } from 'react';



const EnhancedSystemMetrics = ({ stats = {} }) => {

  const [mlData, setMlData] = useState({

    anomalies: 0,const EnhancedSystemMetrics = ({ stats = {} }) => {const EnhancedSystemMetrics = ({ stats = {} }) => {

    maintenance: 0,

    efficiency: 89  const [mlData, setMlData] = useState({  const [mlData, setMlData] = useState({

  });

    anomalies: 0,    anomalies: 0,

  // Fetch ML insights from API

  const fetchMLInsights = async () => {    maintenance: 0,    maintenance: 0,

    try {

      const [anomaliesRes, maintenanceRes] = await Promise.all([    efficiency: 89    efficiency: 89

        fetch('http://localhost:5000/api/ml/anomalies'),

        fetch('http://localhost:5000/api/ml/maintenance')  });  });

      ]);



      const anomaliesData = anomaliesRes.ok ? await anomaliesRes.json() : null;

      const maintenanceData = maintenanceRes.ok ? await maintenanceRes.json() : null;  // Fetch ML insights from API  // Fetch ML insights from API



      // Filter anomalies to last 24 hours  const fetchMLInsights = async () => {  const fetchMLInsights = async () => {

      let recentAnomalies = 0;

      if (anomaliesData?.anomalies) {    try {    try {

        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

        recentAnomalies = anomaliesData.anomalies.filter(      const [anomaliesRes, maintenanceRes] = await Promise.all([      const [anomaliesRes, maintenanceRes] = await Promise.all([

          anomaly => new Date(anomaly.timestamp) > last24Hours

        ).length;        fetch('http://localhost:5000/api/ml/anomalies'),        fetch('http://localhost:5000/api/ml/anomalies'),

      }

        fetch('http://localhost:5000/api/ml/maintenance')        fetch('http://localhost:5000/api/ml/maintenance')

      setMlData({

        anomalies: recentAnomalies,      ]);      ]);

        maintenance: maintenanceData?.count || 0,

        efficiency: 89 // Static for now, could be dynamic

      });

    } catch (error) {      const anomaliesData = anomaliesRes.ok ? await anomaliesRes.json() : null;      const anomaliesData = anomaliesRes.ok ? await anomaliesRes.json() : null;

      console.log('Using fallback ML data');

    }      const maintenanceData = maintenanceRes.ok ? await maintenanceRes.json() : null;      const maintenanceData = maintenanceRes.ok ? await maintenanceRes.json() : null;

  };



  useEffect(() => {

    fetchMLInsights();      // Filter anomalies to last 24 hours      // Filter anomalies to last 24 hours

    const interval = setInterval(fetchMLInsights, 60000); // Update every minute

    return () => clearInterval(interval);      let recentAnomalies = 0;      let recentAnomalies = 0;

  }, []);

      if (anomaliesData?.anomalies) {      if (anomaliesData?.anomalies) {

  return (

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

      {/* Total Devices */}

      <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-6">        recentAnomalies = anomaliesData.anomalies.filter(        recentAnomalies = anomaliesData.anomalies.filter(

        <div className="text-blue-400 text-sm font-medium">TOTAL DEVICES</div>

        <div className="text-3xl font-bold text-white mt-2">          anomaly => new Date(anomaly.timestamp) > last24Hours          anomaly => new Date(anomaly.timestamp) > last24Hours

          {stats.total_devices || 33}

        </div>        ).length;        ).length;

        <div className="text-blue-300 text-sm">Connected</div>

      </div>      }      }



      {/* Active Alerts */}

      <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-xl p-6">

        <div className="text-yellow-400 text-sm font-medium">ACTIVE ALERTS</div>      setMlData({      setMlData({

        <div className="text-3xl font-bold text-white mt-2">

          {stats.active_alerts || 0}        anomalies: recentAnomalies,        anomalies: recentAnomalies,

        </div>

        <div className="text-yellow-300 text-sm">Need Attention</div>        maintenance: maintenanceData?.count || 0,        maintenance: maintenanceData?.count || 0,

      </div>

        efficiency: 89 // Static for now, could be dynamic        efficiency: 89 // Static for now, could be dynamic

      {/* AI Anomalies (24h) */}

      <div className="bg-red-600/20 border border-red-500/30 rounded-xl p-6">      });      });

        <div className="text-red-400 text-sm font-medium">AI ANOMALIES (24h)</div>

        <div className="text-3xl font-bold text-white mt-2">{mlData.anomalies}</div>    } catch (error) {    } catch (error) {

        <div className="text-red-300 text-sm">AI Detected</div>

      </div>      console.log('Using fallback ML data');      console.log('Using fallback ML data');



      {/* Maintenance Predictions */}    }    }

      <div className="bg-purple-600/20 border border-purple-500/30 rounded-xl p-6">

        <div className="text-purple-400 text-sm font-medium">MAINTENANCE</div>  };  };

        <div className="text-3xl font-bold text-white mt-2">{mlData.maintenance}</div>

        <div className="text-purple-300 text-sm">Predictions</div>

      </div>

    </div>  useEffect(() => {  useEffect(() => {

  );

};    fetchMLInsights();    fetchMLInsights();



export default EnhancedSystemMetrics;    const interval = setInterval(fetchMLInsights, 60000); // Update every minute    const interval = setInterval(fetchMLInsights, 60000); // Update every minute

    return () => clearInterval(interval);    return () => clearInterval(interval);

  }, []);  }, []);



  return (  return (

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">

      {/* Total Devices */}      {/* Traditional Metrics */}

      <div className="bg-blue-600/20 border border-blue-500/30 rounded-xl p-6">      <div className="bg-gray-700 rounded-lg p-6">

        <div className="text-blue-400 text-sm font-medium">TOTAL DEVICES</div>        <div className="flex items-center justify-between mb-4">

        <div className="text-3xl font-bold text-white mt-2">          <div className="p-3 rounded-lg bg-blue-500/20 text-blue-400">

          {stats.total_devices || 33}            <span className="text-2xl">🏭</span>

        </div>          </div>

        <div className="text-blue-300 text-sm">Connected</div>        </div>

      </div>        <h4 className="text-2xl font-bold text-white mb-1">{stats.total_devices || 33}</h4>

        <p className="text-sm text-gray-400">Total Devices</p>

      {/* Active Alerts */}      </div>

      <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-xl p-6">      

        <div className="text-yellow-400 text-sm font-medium">ACTIVE ALERTS</div>      <div className="bg-gray-700 rounded-lg p-6">

        <div className="text-3xl font-bold text-white mt-2">        <div className="flex items-center justify-between mb-4">

          {stats.active_alerts || 0}          <div className="p-3 rounded-lg bg-green-500/20 text-green-400">

        </div>            <span className="text-2xl">✅</span>

        <div className="text-yellow-300 text-sm">Need Attention</div>          </div>

      </div>        </div>

        <h4 className="text-2xl font-bold text-white mb-1">{stats.active_devices || 31}</h4>

      {/* AI Anomalies (24h) */}        <p className="text-sm text-gray-400">Active Devices</p>

      <div className="bg-red-600/20 border border-red-500/30 rounded-xl p-6">      </div>

        <div className="text-red-400 text-sm font-medium">AI ANOMALIES (24h)</div>      

        <div className="text-3xl font-bold text-white mt-2">{mlData.anomalies}</div>      <div className="bg-gray-700 rounded-lg p-6">

        <div className="text-red-300 text-sm">AI Detected</div>        <div className="flex items-center justify-between mb-4">

      </div>          <div className="p-3 rounded-lg bg-purple-500/20 text-purple-400">

            <span className="text-2xl">⚡</span>

      {/* Maintenance Predictions */}          </div>

      <div className="bg-purple-600/20 border border-purple-500/30 rounded-xl p-6">        </div>

        <div className="text-purple-400 text-sm font-medium">MAINTENANCE</div>        <h4 className="text-2xl font-bold text-white mb-1">{stats.total_energy_consumption?.toFixed(1) || '127.3'} kWh</h4>

        <div className="text-3xl font-bold text-white mt-2">{mlData.maintenance}</div>        <p className="text-sm text-gray-400">Energy Usage</p>

        <div className="text-purple-300 text-sm">Predictions</div>      </div>

      </div>      

    </div>      <div className="bg-gray-700 rounded-lg p-6">

  );        <div className="flex items-center justify-between mb-4">

};          <div className="p-3 rounded-lg bg-yellow-500/20 text-yellow-400">

            <span className="text-2xl">⚠️</span>

export default EnhancedSystemMetrics;          </div>
        </div>
        <h4 className="text-2xl font-bold text-white mb-1">{stats.active_alerts || 179}</h4>
        <p className="text-sm text-gray-400">Active Alerts</p>
      </div>

      {/* ML-Enhanced Metrics */}
      <div className="bg-gradient-to-br from-red-600/20 to-red-800/20 border border-red-500/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-lg bg-red-500/30 text-red-400">
            <span className="text-2xl">🤖</span>
          </div>
          <div className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">
            ML POWERED
          </div>
        </div>
        <h4 className="text-2xl font-bold text-white mb-1">{mlInsights.anomalies}</h4>
        <p className="text-sm text-red-400">AI-Detected Anomalies</p>
        <div className="mt-2 flex items-center space-x-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-red-300">Real-time Analysis</span>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-yellow-600/20 to-orange-800/20 border border-yellow-500/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-lg bg-yellow-500/30 text-yellow-400">
            <span className="text-2xl">🛠️</span>
          </div>
          <div className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400">
            PREDICTIVE
          </div>
        </div>
        <h4 className="text-2xl font-bold text-white mb-1">{mlInsights.maintenanceAlerts}</h4>
        <p className="text-sm text-yellow-400">Maintenance Due</p>
        <div className="mt-2 flex items-center space-x-1">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-yellow-300">ML Predictions</span>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-green-600/20 to-emerald-800/20 border border-green-500/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-lg bg-green-500/30 text-green-400">
            <span className="text-2xl">📈</span>
          </div>
          <div className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
            AI OPTIMIZED
          </div>
        </div>
        <h4 className="text-2xl font-bold text-white mb-1">{mlInsights.energyEfficiency}%</h4>
        <p className="text-sm text-green-400">Energy Efficiency</p>
        <div className="mt-2 flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-300">ML Enhanced</span>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-blue-600/20 to-purple-800/20 border border-blue-500/30 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-lg bg-blue-500/30 text-blue-400">
            <span className="text-2xl">🎯</span>
          </div>
          <div className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
            PREDICTION
          </div>
        </div>
        <h4 className="text-2xl font-bold text-white mb-1">{mlInsights.predictiveScore}%</h4>
        <p className="text-sm text-blue-400">ML Accuracy</p>
        <div className="mt-2 flex items-center space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-blue-300">Model Performance</span>
        </div>
      </div>
    </div>
  );
};

export default EnhancedSystemMetrics;