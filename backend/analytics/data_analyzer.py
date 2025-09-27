"""
Data Analytics Engine for IoT System
Provides comprehensive analysis of sensor data, trends, and insights
"""

import sqlite3
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class DataAnalyzer:
    """Main data analysis class for IoT sensor data"""
    
    def __init__(self):
        self.db_path = 'iot_data.db'
        
        # Thresholds for alerts
        self.thresholds = {
            'high_current': 30.0,  # Amps
            'high_temperature': 60.0,  # Celsius
            'high_pressure': 7.0,  # bar
            'low_pressure': 0.5,  # bar
        }
    
    def get_data_frame(self, hours=24, device_id=None):
        """Get sensor data as pandas DataFrame"""
        try:
            db = sqlite3.connect(self.db_path)
            
            since = (datetime.now() - timedelta(hours=hours)).isoformat()
            
            if device_id:
                query = '''
                    SELECT * FROM sensor_readings 
                    WHERE timestamp > ? AND device_id = ?
                    ORDER BY timestamp DESC
                '''
                df = pd.read_sql_query(query, db, params=(since, device_id))
            else:
                query = '''
                    SELECT * FROM sensor_readings 
                    WHERE timestamp > ?
                    ORDER BY timestamp DESC
                '''
                df = pd.read_sql_query(query, db, params=(since,))
            
            db.close()
            
            if not df.empty:
                df['timestamp'] = pd.to_datetime(df['timestamp'])
                df = df.sort_values('timestamp')
            
            return df
            
        except Exception as e:
            logger.error(f"Error getting data frame: {e}")
            return pd.DataFrame()
    
    def get_overview_analytics(self, hours=24):
        """Get overall system analytics"""
        try:
            df = self.get_data_frame(hours)
            
            if df.empty:
                return {"error": "No data available"}
            
            # Basic statistics
            total_readings = len(df)
            unique_devices = df['device_id'].nunique()
            avg_current = df['current'].mean()
            avg_temperature = df['temperature'].mean()
            avg_pressure = df['pressure'].mean()
            
            # Energy consumption (simplified calculation)
            total_energy = df['current'].sum() * (hours / len(df))  # Approximate kWh
            
            # Device status summary
            active_devices = df[df['is_active'] == 1]['device_id'].nunique()
            devices_on = df[df['relay_status'] == 'ON']['device_id'].nunique()
            maintenance_needed = df[df['maintenance_required'] == 1]['device_id'].nunique()
            
            # Peak values
            max_current = df['current'].max()
            max_temperature = df['temperature'].max()
            max_pressure = df['pressure'].max()
            
            # Alert counts
            high_current_alerts = len(df[df['current'] > self.thresholds['high_current']])
            high_temp_alerts = len(df[df['temperature'] > self.thresholds['high_temperature']])
            high_pressure_alerts = len(df[df['pressure'] > self.thresholds['high_pressure']])
            
            return {
                "total_readings": total_readings,
                "unique_devices": unique_devices,
                "active_devices": active_devices,
                "devices_on": devices_on,
                "maintenance_needed": maintenance_needed,
                "averages": {
                    "current": round(avg_current, 2),
                    "temperature": round(avg_temperature, 2),
                    "pressure": round(avg_pressure, 2)
                },
                "peaks": {
                    "max_current": round(max_current, 2),
                    "max_temperature": round(max_temperature, 2),
                    "max_pressure": round(max_pressure, 2)
                },
                "energy": {
                    "estimated_consumption_kwh": round(total_energy, 2)
                },
                "alert_counts": {
                    "high_current": high_current_alerts,
                    "high_temperature": high_temp_alerts,
                    "high_pressure": high_pressure_alerts
                }
            }
            
        except Exception as e:
            logger.error(f"Error in overview analytics: {e}")
            return {"error": str(e)}
    
    def analyze_energy_consumption(self, hours=24):
        """Analyze energy consumption patterns"""
        try:
            df = self.get_data_frame(hours)
            
            if df.empty:
                return {"error": "No data available"}
            
            # Energy consumption by device type
            energy_by_type = df.groupby('device_type')['current'].agg(['mean', 'sum', 'count']).round(2)
            
            # Energy consumption over time (hourly breakdown)
            df['hour'] = df['timestamp'].dt.hour
            hourly_consumption = df.groupby('hour')['current'].mean().round(2)
            
            # High energy consumers
            device_consumption = df.groupby('device_id')['current'].agg(['mean', 'max']).round(2)
            high_consumers = device_consumption[device_consumption['mean'] > self.thresholds['high_current']/2]
            
            # Energy efficiency metrics
            efficiency_data = df[df['relay_status'] == 'ON'].groupby('device_id').agg({
                'current': ['mean', 'std'],
                'temperature': 'mean',
                'pressure': 'mean'
            }).round(2)
            
            return {
                "energy_by_type": energy_by_type.to_dict('index'),
                "hourly_consumption": hourly_consumption.to_dict(),
                "high_consumers": high_consumers.to_dict('index'),
                "efficiency_metrics": {
                    "devices_analyzed": len(efficiency_data),
                    "avg_current_variation": efficiency_data[('current', 'std')].mean() if not efficiency_data.empty else 0
                }
            }
            
        except Exception as e:
            logger.error(f"Error in energy analysis: {e}")
            return {"error": str(e)}
    
    def detect_alerts(self):
        """Detect current system alerts"""
        try:
            # Get latest readings for each device
            db = sqlite3.connect(self.db_path)
            query = '''
                SELECT sr.* FROM sensor_readings sr
                INNER JOIN (
                    SELECT device_id, MAX(timestamp) as max_time
                    FROM sensor_readings
                    GROUP BY device_id
                ) latest ON sr.device_id = latest.device_id 
                AND sr.timestamp = latest.max_time
            '''
            df = pd.read_sql_query(query, db)
            db.close()
            
            alerts = []
            
            for _, row in df.iterrows():
                # High current alert
                if row['current'] > self.thresholds['high_current']:
                    alerts.append({
                        "device_id": row['device_id'],
                        "alert_type": "high_current",
                        "severity": "high" if row['current'] > self.thresholds['high_current'] * 1.5 else "medium",
                        "message": f"High current detected: {row['current']}A (threshold: {self.thresholds['high_current']}A)",
                        "value": row['current'],
                        "threshold": self.thresholds['high_current'],
                        "timestamp": row['timestamp']
                    })
                
                # High temperature alert
                if row['temperature'] > self.thresholds['high_temperature']:
                    alerts.append({
                        "device_id": row['device_id'],
                        "alert_type": "high_temperature",
                        "severity": "high" if row['temperature'] > self.thresholds['high_temperature'] * 1.2 else "medium",
                        "message": f"High temperature detected: {row['temperature']}°C (threshold: {self.thresholds['high_temperature']}°C)",
                        "value": row['temperature'],
                        "threshold": self.thresholds['high_temperature'],
                        "timestamp": row['timestamp']
                    })
                
                # Pressure alerts
                if row['pressure'] > self.thresholds['high_pressure']:
                    alerts.append({
                        "device_id": row['device_id'],
                        "alert_type": "high_pressure",
                        "severity": "high",
                        "message": f"High pressure detected: {row['pressure']} bar (threshold: {self.thresholds['high_pressure']} bar)",
                        "value": row['pressure'],
                        "threshold": self.thresholds['high_pressure'],
                        "timestamp": row['timestamp']
                    })
                
                elif row['pressure'] < self.thresholds['low_pressure']:
                    alerts.append({
                        "device_id": row['device_id'],
                        "alert_type": "low_pressure",
                        "severity": "medium",
                        "message": f"Low pressure detected: {row['pressure']} bar (threshold: {self.thresholds['low_pressure']} bar)",
                        "value": row['pressure'],
                        "threshold": self.thresholds['low_pressure'],
                        "timestamp": row['timestamp']
                    })
                
                # Maintenance required
                if row['maintenance_required']:
                    alerts.append({
                        "device_id": row['device_id'],
                        "alert_type": "maintenance_required",
                        "severity": "medium",
                        "message": f"Device requires maintenance",
                        "value": None,
                        "threshold": None,
                        "timestamp": row['timestamp']
                    })
                
                # Device offline
                if not row['is_active']:
                    alerts.append({
                        "device_id": row['device_id'],
                        "alert_type": "device_offline",
                        "severity": "low",
                        "message": f"Device is offline",
                        "value": None,
                        "threshold": None,
                        "timestamp": row['timestamp']
                    })
            
            return alerts
            
        except Exception as e:
            logger.error(f"Error detecting alerts: {e}")
            return []
    
    def analyze_trends(self, hours=168):  # Default 1 week
        """Analyze trends in sensor data"""
        try:
            df = self.get_data_frame(hours)
            
            if df.empty:
                return {"error": "No data available"}
            
            # Time-based aggregation
            df['hour'] = df['timestamp'].dt.floor('H')
            hourly_data = df.groupby('hour').agg({
                'current': ['mean', 'max', 'min'],
                'temperature': ['mean', 'max', 'min'],
                'pressure': ['mean', 'max', 'min']
            }).round(2)
            
            # Calculate trends (simple linear regression slope)
            from scipy import stats
            
            trends = {}
            for metric in ['current', 'temperature', 'pressure']:
                if len(hourly_data) > 2:
                    x = range(len(hourly_data))
                    y = hourly_data[(metric, 'mean')].values
                    slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)
                    
                    trends[metric] = {
                        "slope": round(slope, 4),
                        "r_squared": round(r_value**2, 4),
                        "trend_direction": "increasing" if slope > 0 else "decreasing" if slope < 0 else "stable",
                        "significance": "significant" if p_value < 0.05 else "not_significant"
                    }
            
            # Recent vs historical comparison (last 25% vs first 75%)
            split_point = int(len(df) * 0.75)
            historical = df.iloc[:split_point]
            recent = df.iloc[split_point:]
            
            comparison = {}
            for metric in ['current', 'temperature', 'pressure']:
                if not historical.empty and not recent.empty:
                    historical_avg = historical[metric].mean()
                    recent_avg = recent[metric].mean()
                    change_pct = ((recent_avg - historical_avg) / historical_avg) * 100 if historical_avg != 0 else 0
                    
                    comparison[metric] = {
                        "historical_avg": round(historical_avg, 2),
                        "recent_avg": round(recent_avg, 2),
                        "change_percent": round(change_pct, 2)
                    }
            
            return {
                "trends": trends,
                "comparison": comparison,
                "data_points_analyzed": len(df),
                "timeframe_hours": hours
            }
            
        except ImportError:
            # Fallback if scipy is not available
            logger.warning("Scipy not available, using simple trend analysis")
            return self.simple_trend_analysis(df)
        except Exception as e:
            logger.error(f"Error in trend analysis: {e}")
            return {"error": str(e)}
    
    def simple_trend_analysis(self, df):
        """Simple trend analysis without scipy"""
        try:
            if df.empty:
                return {"error": "No data available"}
            
            # Simple trend calculation using first and last values
            first_quarter = df.iloc[:len(df)//4]
            last_quarter = df.iloc[-len(df)//4:]
            
            trends = {}
            for metric in ['current', 'temperature', 'pressure']:
                first_avg = first_quarter[metric].mean()
                last_avg = last_quarter[metric].mean()
                
                if first_avg != 0:
                    change_pct = ((last_avg - first_avg) / first_avg) * 100
                    
                    trends[metric] = {
                        "change_percent": round(change_pct, 2),
                        "trend_direction": "increasing" if change_pct > 5 else "decreasing" if change_pct < -5 else "stable"
                    }
            
            return {"trends": trends, "method": "simple"}
            
        except Exception as e:
            logger.error(f"Error in simple trend analysis: {e}")
            return {"error": str(e)}
    
    def get_device_insights(self, device_id, hours=168):
        """Get detailed insights for a specific device"""
        try:
            df = self.get_data_frame(hours, device_id)
            
            if df.empty:
                return {"error": "No data available for device"}
            
            # Basic statistics
            stats = {
                "total_readings": len(df),
                "uptime_percentage": (len(df[df['is_active'] == 1]) / len(df)) * 100,
                "avg_metrics": {
                    "current": round(df['current'].mean(), 2),
                    "temperature": round(df['temperature'].mean(), 2),
                    "pressure": round(df['pressure'].mean(), 2)
                },
                "min_max": {
                    "current": [round(df['current'].min(), 2), round(df['current'].max(), 2)],
                    "temperature": [round(df['temperature'].min(), 2), round(df['temperature'].max(), 2)],
                    "pressure": [round(df['pressure'].min(), 2), round(df['pressure'].max(), 2)]
                }
            }
            
            # Performance metrics
            performance = {
                "stability_score": self.calculate_stability_score(df),
                "efficiency_score": self.calculate_efficiency_score(df),
                "alert_frequency": len(df[
                    (df['current'] > self.thresholds['high_current']) |
                    (df['temperature'] > self.thresholds['high_temperature']) |
                    (df['pressure'] > self.thresholds['high_pressure'])
                ]) / len(df) * 100
            }
            
            return {
                "device_id": device_id,
                "statistics": stats,
                "performance": performance,
                "device_type": df['device_type'].iloc[0] if not df.empty else "unknown",
                "last_reading": df.iloc[-1].to_dict() if not df.empty else None
            }
            
        except Exception as e:
            logger.error(f"Error getting device insights: {e}")
            return {"error": str(e)}
    
    def calculate_stability_score(self, df):
        """Calculate stability score based on variance in readings"""
        try:
            if df.empty:
                return 0
            
            # Calculate coefficient of variation for key metrics
            current_cv = df['current'].std() / df['current'].mean() if df['current'].mean() > 0 else float('inf')
            temp_cv = df['temperature'].std() / df['temperature'].mean() if df['temperature'].mean() > 0 else float('inf')
            pressure_cv = df['pressure'].std() / df['pressure'].mean() if df['pressure'].mean() > 0 else float('inf')
            
            # Convert to stability score (lower variance = higher stability)
            avg_cv = np.mean([current_cv, temp_cv, pressure_cv])
            stability_score = max(0, 100 - (avg_cv * 100))
            
            return round(stability_score, 1)
            
        except Exception as e:
            logger.error(f"Error calculating stability score: {e}")
            return 0
    
    def calculate_efficiency_score(self, df):
        """Calculate efficiency score based on energy usage patterns"""
        try:
            if df.empty:
                return 0
            
            # Simple efficiency calculation based on current usage vs expected
            avg_current = df['current'].mean()
            device_type = df['device_type'].iloc[0]
            
            # Expected current ranges by device type
            expected_ranges = {
                'pump': (8, 15),
                'motor': (10, 20),
                'heater': (15, 25),
                'compressor': (12, 22),
                'conveyor': (5, 12),
                'sensor_unit': (1, 5)
            }
            
            expected_min, expected_max = expected_ranges.get(device_type, (5, 25))
            
            if expected_min <= avg_current <= expected_max:
                efficiency_score = 100
            elif avg_current < expected_min:
                efficiency_score = (avg_current / expected_min) * 100
            else:
                efficiency_score = max(0, 100 - ((avg_current - expected_max) / expected_max) * 100)
            
            return round(efficiency_score, 1)
            
        except Exception as e:
            logger.error(f"Error calculating efficiency score: {e}")
            return 0