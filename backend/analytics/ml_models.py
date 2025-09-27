"""
Machine Learning models for IoT analytics
Includes energy optimization and anomaly detection
"""

import sqlite3
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
import pickle
import os

logger = logging.getLogger(__name__)

try:
    from sklearn.ensemble import IsolationForest, RandomForestRegressor
    from sklearn.preprocessing import StandardScaler
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import mean_squared_error
    SKLEARN_AVAILABLE = True
except ImportError:
    logger.warning("scikit-learn not available. ML features will use simplified implementations.")
    SKLEARN_AVAILABLE = False

class EnergyOptimizer:
    """ML-based energy optimization recommendations"""
    
    def __init__(self):
        self.db_path = 'iot_data.db'
        self.model_path = 'energy_model.pkl'
        self.scaler_path = 'energy_scaler.pkl'
        self.model = None
        self.scaler = None
        
    def get_energy_data(self, hours=168):  # 1 week default
        """Get energy consumption data for training"""
        try:
            db = sqlite3.connect(self.db_path)
            since = (datetime.now() - timedelta(hours=hours)).isoformat()
            
            query = '''
                SELECT 
                    device_id, device_type, timestamp, current, temperature, 
                    pressure, relay_status, is_active
                FROM sensor_readings 
                WHERE timestamp > ? AND is_active = 1
                ORDER BY timestamp
            '''
            df = pd.read_sql_query(query, db, params=(since,))
            db.close()
            
            if df.empty:
                return df
            
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df['hour'] = df['timestamp'].dt.hour
            df['day_of_week'] = df['timestamp'].dt.dayofweek
            df['relay_numeric'] = df['relay_status'].map({'ON': 1, 'OFF': 0})
            
            return df
            
        except Exception as e:
            logger.error(f"Error getting energy data: {e}")
            return pd.DataFrame()
    
    def train_energy_model(self):
        """Train ML model for energy prediction"""
        if not SKLEARN_AVAILABLE:
            logger.warning("Scikit-learn not available for ML training")
            return False
        
        try:
            df = self.get_energy_data()
            
            if df.empty or len(df) < 100:
                logger.warning("Insufficient data for ML training")
                return False
            
            # Feature engineering
            features = ['temperature', 'pressure', 'hour', 'day_of_week', 'relay_numeric']
            
            # Encode device types
            device_types = pd.get_dummies(df['device_type'], prefix='device')
            df = pd.concat([df, device_types], axis=1)
            features.extend(device_types.columns.tolist())
            
            X = df[features].fillna(0)
            y = df['current']
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            # Scale features
            self.scaler = StandardScaler()
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Train model
            self.model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
            self.model.fit(X_train_scaled, y_train)
            
            # Evaluate
            y_pred = self.model.predict(X_test_scaled)
            mse = mean_squared_error(y_test, y_pred)
            
            logger.info(f"Energy model trained with MSE: {mse:.2f}")
            
            # Save models
            with open(self.model_path, 'wb') as f:
                pickle.dump(self.model, f)
            with open(self.scaler_path, 'wb') as f:
                pickle.dump(self.scaler, f)
            
            return True
            
        except Exception as e:
            logger.error(f"Error training energy model: {e}")
            return False
    
    def load_model(self):
        """Load trained ML model"""
        try:
            if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
                with open(self.model_path, 'rb') as f:
                    self.model = pickle.load(f)
                with open(self.scaler_path, 'rb') as f:
                    self.scaler = pickle.load(f)
                return True
            return False
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            return False
    
    def get_optimization_recommendations(self):
        """Get energy optimization recommendations"""
        try:
            if not SKLEARN_AVAILABLE or not self.load_model():
                return self.get_simple_recommendations()
            
            df = self.get_energy_data(hours=24)  # Last 24 hours
            
            if df.empty:
                return {"error": "No recent data available"}
            
            recommendations = []
            
            # Analyze current consumption patterns
            device_consumption = df.groupby(['device_id', 'device_type']).agg({
                'current': ['mean', 'max', 'count'],
                'temperature': 'mean'
            }).round(2)
            
            # High consumers
            high_consumers = device_consumption[device_consumption[('current', 'mean')] > 20]
            
            for device_id, data in high_consumers.iterrows():
                avg_current = data[('current', 'mean')]
                max_current = data[('current', 'max')]
                device_type = device_id[1]
                
                recommendations.append({
                    "device_id": device_id[0],
                    "type": "high_energy_consumption",
                    "priority": "high" if avg_current > 30 else "medium",
                    "message": f"Device consuming {avg_current}A average (max: {max_current}A)",
                    "suggestion": "Consider scheduling during off-peak hours or maintenance check",
                    "potential_savings_percent": min(15, max(5, (avg_current - 15) / avg_current * 100))
                })
            
            # Peak time recommendations
            hourly_consumption = df.groupby('hour')['current'].mean()
            peak_hours = hourly_consumption[hourly_consumption > hourly_consumption.mean() * 1.2].index.tolist()
            
            if peak_hours:
                recommendations.append({
                    "type": "peak_time_optimization",
                    "priority": "medium",
                    "message": f"High consumption during hours: {peak_hours}",
                    "suggestion": "Consider staggering device operations to reduce peak load",
                    "potential_savings_percent": 10
                })
            
            # Device type optimization
            type_efficiency = df.groupby('device_type').agg({
                'current': 'mean',
                'temperature': 'mean'
            })
            
            for device_type, data in type_efficiency.iterrows():
                if data['current'] > 25 and data['temperature'] > 50:
                    recommendations.append({
                        "type": "device_type_optimization",
                        "device_type": device_type,
                        "priority": "medium",
                        "message": f"{device_type} devices showing high energy use with elevated temperature",
                        "suggestion": "Check cooling systems and maintenance schedules",
                        "potential_savings_percent": 8
                    })
            
            # Overall system recommendations
            total_current = df['current'].sum()
            active_devices = df['device_id'].nunique()
            
            recommendations.append({
                "type": "system_optimization",
                "priority": "low",
                "message": f"Total system consumption: {total_current:.1f}A across {active_devices} devices",
                "suggestion": "Implement smart scheduling for 10-20% energy savings",
                "potential_savings_percent": 15
            })
            
            return {
                "total_recommendations": len(recommendations),
                "recommendations": recommendations,
                "analysis_timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting optimization recommendations: {e}")
            return {"error": str(e)}
    
    def get_simple_recommendations(self):
        """Simple optimization recommendations without ML"""
        try:
            df = self.get_energy_data(hours=24)
            
            if df.empty:
                return {"error": "No data available"}
            
            recommendations = []
            
            # Simple rule-based recommendations
            high_current_devices = df[df['current'] > 25]['device_id'].unique()
            
            for device_id in high_current_devices:
                device_data = df[df['device_id'] == device_id]
                avg_current = device_data['current'].mean()
                
                recommendations.append({
                    "device_id": device_id,
                    "type": "high_energy_consumption",
                    "priority": "high" if avg_current > 35 else "medium",
                    "message": f"High energy consumption: {avg_current:.1f}A",
                    "suggestion": "Review operational schedule and maintenance status",
                    "method": "rule_based"
                })
            
            # Peak usage times
            hourly_avg = df.groupby('hour')['current'].mean()
            peak_hour = hourly_avg.idxmax()
            
            recommendations.append({
                "type": "peak_time_optimization",
                "priority": "medium",
                "message": f"Peak consumption at hour {peak_hour}",
                "suggestion": "Consider load balancing during peak hours",
                "method": "rule_based"
            })
            
            return {
                "total_recommendations": len(recommendations),
                "recommendations": recommendations,
                "method": "simplified"
            }
            
        except Exception as e:
            logger.error(f"Error with simple recommendations: {e}")
            return {"error": str(e)}

class AnomalyDetector:
    """ML-based anomaly detection for IoT devices"""
    
    def __init__(self):
        self.db_path = 'iot_data.db'
        self.model_path = 'anomaly_model.pkl'
        self.model = None
    
    def get_anomaly_data(self, hours=168):
        """Get data for anomaly detection"""
        try:
            db = sqlite3.connect(self.db_path)
            since = (datetime.now() - timedelta(hours=hours)).isoformat()
            
            query = '''
                SELECT 
                    device_id, device_type, timestamp, current, temperature, pressure,
                    relay_status, is_active, maintenance_required
                FROM sensor_readings 
                WHERE timestamp > ?
                ORDER BY timestamp
            '''
            df = pd.read_sql_query(query, db, params=(since,))
            db.close()
            
            if df.empty:
                return df
            
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            return df
            
        except Exception as e:
            logger.error(f"Error getting anomaly data: {e}")
            return pd.DataFrame()
    
    def train_anomaly_model(self):
        """Train anomaly detection model"""
        if not SKLEARN_AVAILABLE:
            logger.warning("Scikit-learn not available for anomaly detection")
            return False
        
        try:
            df = self.get_anomaly_data()
            
            if df.empty or len(df) < 100:
                logger.warning("Insufficient data for anomaly training")
                return False
            
            # Prepare features
            features = ['current', 'temperature', 'pressure']
            X = df[features].fillna(0)
            
            # Train Isolation Forest
            self.model = IsolationForest(contamination=0.1, random_state=42, n_jobs=-1)
            self.model.fit(X)
            
            # Save model
            with open(self.model_path, 'wb') as f:
                pickle.dump(self.model, f)
            
            logger.info("Anomaly detection model trained successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error training anomaly model: {e}")
            return False
    
    def load_anomaly_model(self):
        """Load trained anomaly detection model"""
        try:
            if os.path.exists(self.model_path):
                with open(self.model_path, 'rb') as f:
                    self.model = pickle.load(f)
                return True
            return False
        except Exception as e:
            logger.error(f"Error loading anomaly model: {e}")
            return False
    
    def detect_anomalies(self, hours=24):
        """Detect anomalies in recent data"""
        try:
            if not SKLEARN_AVAILABLE or not self.load_anomaly_model():
                return self.detect_simple_anomalies(hours)
            
            df = self.get_anomaly_data(hours)
            
            if df.empty:
                return []
            
            features = ['current', 'temperature', 'pressure']
            X = df[features].fillna(0)
            
            # Predict anomalies (-1 for anomalies, 1 for normal)
            anomaly_scores = self.model.decision_function(X)
            anomalies = self.model.predict(X)
            
            # Get anomalous readings
            anomalous_indices = np.where(anomalies == -1)[0]
            
            anomaly_list = []
            for idx in anomalous_indices:
                row = df.iloc[idx]
                score = anomaly_scores[idx]
                
                anomaly_list.append({
                    "device_id": row['device_id'],
                    "timestamp": row['timestamp'].isoformat(),
                    "anomaly_score": float(score),
                    "current": row['current'],
                    "temperature": row['temperature'],
                    "pressure": row['pressure'],
                    "device_type": row['device_type'],
                    "severity": "high" if score < -0.5 else "medium"
                })
            
            return sorted(anomaly_list, key=lambda x: x['anomaly_score'])
            
        except Exception as e:
            logger.error(f"Error detecting anomalies: {e}")
            return []
    
    def detect_simple_anomalies(self, hours=24):
        """Simple anomaly detection using statistical methods"""
        try:
            df = self.get_anomaly_data(hours)
            
            if df.empty:
                return []
            
            anomalies = []
            
            # Statistical outliers (values beyond 3 standard deviations)
            for metric in ['current', 'temperature', 'pressure']:
                mean_val = df[metric].mean()
                std_val = df[metric].std()
                threshold = 3 * std_val
                
                outliers = df[abs(df[metric] - mean_val) > threshold]
                
                for _, row in outliers.iterrows():
                    z_score = abs(row[metric] - mean_val) / std_val if std_val > 0 else 0
                    
                    anomalies.append({
                        "device_id": row['device_id'],
                        "timestamp": row['timestamp'].isoformat(),
                        "anomaly_type": f"{metric}_outlier",
                        "z_score": float(z_score),
                        "value": row[metric],
                        "mean": mean_val,
                        "severity": "high" if z_score > 4 else "medium",
                        "method": "statistical"
                    })
            
            return anomalies
            
        except Exception as e:
            logger.error(f"Error with simple anomaly detection: {e}")
            return []
    
    def predict_failures(self, hours=24):
        """Predict potential system failures"""
        try:
            df = self.get_anomaly_data(hours)
            
            if df.empty:
                return []
            
            predictions = []
            
            # Analyze each device for failure indicators
            for device_id in df['device_id'].unique():
                device_data = df[df['device_id'] == device_id].sort_values('timestamp')
                
                if len(device_data) < 5:  # Not enough data
                    continue
                
                # Recent trend analysis
                recent_current = device_data['current'].tail(5).mean()
                recent_temp = device_data['temperature'].tail(5).mean()
                recent_pressure = device_data['pressure'].tail(5).mean()
                
                historical_current = device_data['current'].head(-5).mean() if len(device_data) > 5 else recent_current
                historical_temp = device_data['temperature'].head(-5).mean() if len(device_data) > 5 else recent_temp
                historical_pressure = device_data['pressure'].head(-5).mean() if len(device_data) > 5 else recent_pressure
                
                # Failure indicators
                failure_score = 0
                reasons = []
                
                # Rising temperature
                if recent_temp > historical_temp * 1.2:
                    failure_score += 30
                    reasons.append("Increasing temperature trend")
                
                # Rising current (overload)
                if recent_current > historical_current * 1.3:
                    failure_score += 25
                    reasons.append("Increasing current consumption")
                
                # Pressure instability
                pressure_std = device_data['pressure'].tail(10).std()
                if pressure_std > device_data['pressure'].std() * 1.5:
                    failure_score += 20
                    reasons.append("Pressure instability")
                
                # Maintenance flag
                if device_data['maintenance_required'].iloc[-1]:
                    failure_score += 40
                    reasons.append("Maintenance required flag")
                
                # High absolute values
                if recent_temp > 70:
                    failure_score += 15
                    reasons.append("High temperature")
                
                if recent_current > 40:
                    failure_score += 10
                    reasons.append("High current")
                
                if failure_score >= 50:  # Threshold for prediction
                    predictions.append({
                        "device_id": device_id,
                        "failure_probability": min(100, failure_score),
                        "risk_level": "high" if failure_score >= 70 else "medium",
                        "reasons": reasons,
                        "current_metrics": {
                            "current": round(recent_current, 2),
                            "temperature": round(recent_temp, 2),
                            "pressure": round(recent_pressure, 2)
                        },
                        "prediction_timestamp": datetime.now().isoformat()
                    })
            
            return sorted(predictions, key=lambda x: x['failure_probability'], reverse=True)
            
        except Exception as e:
            logger.error(f"Error predicting failures: {e}")
            return []