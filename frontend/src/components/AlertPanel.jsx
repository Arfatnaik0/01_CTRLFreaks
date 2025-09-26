import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle, Clock, Thermometer, Zap, Gauge } from 'lucide-react';
import { format } from 'date-fns';

const AlertPanel = ({ alerts = [], detailed = false }) => {
  const getSeverityIcon = (severity) => {
    const iconMap = {
      critical: AlertTriangle,
      warning: AlertCircle,
      info: Info
    };
    return iconMap[severity] || AlertCircle;
  };

  const getSeverityColor = (severity) => {
    const colorMap = {
      critical: 'bg-red-500/20 text-red-400 border-red-500/30',
      warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      info: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    };
    return colorMap[severity] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const getAlertTypeIcon = (alertType) => {
    const iconMap = {
      temperature_anomaly: Thermometer,
      current_anomaly: Zap,
      pressure_anomaly: Gauge,
      efficiency_drop: AlertTriangle,
      maintenance_required: Clock
    };
    return iconMap[alertType] || AlertCircle;
  };

  const unresolvedAlerts = alerts.filter(alert => !alert.is_resolved);
  const resolvedAlerts = alerts.filter(alert => alert.is_resolved);

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">
          Alerts {!detailed && `(${unresolvedAlerts.length})`}
        </h3>
        {detailed && (
          <div className="flex space-x-4 text-sm">
            <span className="text-red-400">Active: {unresolvedAlerts.length}</span>
            <span className="text-green-400">Resolved: {resolvedAlerts.length}</span>
          </div>
        )}
      </div>

      {!alerts.length ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-400">No alerts at this time</p>
            <p className="text-sm text-gray-500 mt-1">System running normally</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Alerts */}
          {unresolvedAlerts.length > 0 && (
            <div>
              {detailed && (
                <h4 className="text-md font-medium text-red-400 mb-3 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Active Alerts ({unresolvedAlerts.length})
                </h4>
              )}
              <div className="space-y-3">
                {unresolvedAlerts.map((alert) => {
                  const SeverityIcon = getSeverityIcon(alert.severity);
                  const TypeIcon = getAlertTypeIcon(alert.alert_type);
                  
                  return (
                    <div
                      key={alert.id}
                      className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <SeverityIcon className="h-5 w-5 mt-0.5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h5 className="font-medium">{alert.device_id}</h5>
                              <TypeIcon className="h-4 w-4" />
                              <span className="text-xs px-2 py-1 rounded-full bg-current/20 capitalize">
                                {alert.severity}
                              </span>
                            </div>
                            <p className="text-sm mb-2">{alert.message}</p>
                            <div className="text-xs opacity-75">
                              {format(new Date(alert.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                            </div>
                          </div>
                        </div>
                        
                        {detailed && (
                          <div className="flex space-x-2">
                            <button className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-md hover:bg-blue-500/30">
                              Investigate
                            </button>
                            <button className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-md hover:bg-green-500/30">
                              Resolve
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Resolved Alerts (detailed view only) */}
          {detailed && resolvedAlerts.length > 0 && (
            <div className="mt-8">
              <h4 className="text-md font-medium text-green-400 mb-3 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Recently Resolved ({resolvedAlerts.slice(0, 5).length})
              </h4>
              <div className="space-y-3">
                {resolvedAlerts.slice(0, 5).map((alert) => {
                  const TypeIcon = getAlertTypeIcon(alert.alert_type);
                  
                  return (
                    <div
                      key={alert.id}
                      className="border border-green-500/30 bg-green-500/10 text-green-400 rounded-lg p-4"
                    >
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h5 className="font-medium">{alert.device_id}</h5>
                            <TypeIcon className="h-4 w-4" />
                          </div>
                          <p className="text-sm mb-2 opacity-90">{alert.message}</p>
                          <div className="text-xs opacity-75 space-x-4">
                            <span>Created: {format(new Date(alert.timestamp), 'MMM dd, HH:mm')}</span>
                            {alert.resolved_at && (
                              <span>Resolved: {format(new Date(alert.resolved_at), 'MMM dd, HH:mm')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {resolvedAlerts.length > 5 && (
                <div className="mt-3 text-center">
                  <button className="text-sm text-gray-400 hover:text-gray-300">
                    View All Resolved Alerts ({resolvedAlerts.length})
                  </button>
                </div>
              )}
            </div>
          )}

          {/* No active alerts but has resolved ones */}
          {!detailed && unresolvedAlerts.length === 0 && resolvedAlerts.length > 0 && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
                <p className="text-gray-400">All alerts resolved</p>
                <p className="text-sm text-gray-500 mt-1">
                  {resolvedAlerts.length} issue{resolvedAlerts.length !== 1 ? 's' : ''} handled today
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {!detailed && unresolvedAlerts.length > 5 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <button className="w-full text-center text-blue-400 hover:text-blue-300 text-sm font-medium">
            View All Alerts ({alerts.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default AlertPanel;