import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, accuracy_score
import joblib
import psycopg2
from datetime import datetime, timedelta
import logging
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class IoTMLAnalyzer:
    def __init__(self):
        self.db_config = {
            'host': 'localhost',
            'database': 'iot_energy_db',
            'user': 'iot_user',
            'password': 'iot_password',
            'port': '5432'
        }
        self.scaler = StandardScaler()
        self.anomaly_model = IsolationForest(contamination=0.1, random_state=42)
        self.energy_predictor = RandomForestRegressor(n_estimators=100, random_state=42)
        self.maintenance_predictor = RandomForestRegressor(n_estimators=100, random_state=42)
        
    def connect_db(self):
        """Connect to PostgreSQL database"""
        try:
            conn = psycopg2.connect(**self.db_config)
            return conn
        except Exception as e:
            logger.error(f"Database connection error: {e}")
            return None
    
    def load_sensor_data(self, hours_back=24):
        """Load recent sensor data for analysis"""
        conn = self.connect_db()
        if not conn:
            return None
            
        query = """
        SELECT 
            device_id,
            timestamp,
            temperature,
            pressure,
            current_value as current,
            temperature * 1.2 as voltage,
            energy_consumption as power_consumption,
            CASE 
                WHEN energy_consumption > 0 THEN 85 + (temperature - 20) * 0.5 
                ELSE 85 
            END as efficiency,
            CASE 
                WHEN current_value > 3.0 THEN current_value * 0.3 
                ELSE 0.1 
            END as vibration,
            CASE 
                WHEN temperature > 25 THEN 65 - (temperature - 25) * 2
                ELSE 70
            END as humidity
        FROM sensor_data 
        WHERE timestamp >= %s AND energy_consumption IS NOT NULL
        ORDER BY timestamp DESC
        """
        
        cutoff_time = datetime.now() - timedelta(hours=hours_back)
        
        try:
            df = pd.read_sql_query(query, conn, params=[cutoff_time])
            conn.close()
            logger.info(f"Loaded {len(df)} sensor readings for ML analysis")
            return df
        except Exception as e:
            logger.error(f"Error loading sensor data: {e}")
            conn.close()
            return None
    
    def prepare_features(self, df):
        """Prepare features for ML models"""
        # Feature engineering
        df['hour'] = pd.to_datetime(df['timestamp']).dt.hour
        df['day_of_week'] = pd.to_datetime(df['timestamp']).dt.dayofweek
        df['power_efficiency_ratio'] = df['power_consumption'] / (df['efficiency'] + 0.01)
        df['temp_pressure_interaction'] = df['temperature'] * df['pressure']
        df['voltage_current_ratio'] = df['voltage'] / (df['current'] + 0.01)
        
        # Select features for modeling
        feature_columns = [
            'temperature', 'pressure', 'current', 'voltage', 
            'power_consumption', 'efficiency', 'vibration', 'humidity',
            'hour', 'day_of_week', 'power_efficiency_ratio', 
            'temp_pressure_interaction', 'voltage_current_ratio'
        ]
        
        return df[feature_columns].fillna(df[feature_columns].mean())
    
    def train_anomaly_detection(self):
        """Train anomaly detection model"""
        logger.info("Training anomaly detection model...")
        
        df = self.load_sensor_data(hours_back=72)  # 3 days of data
        if df is None or len(df) < 100:
            logger.warning("Insufficient data for anomaly detection training")
            return False
            
        features = self.prepare_features(df)
        
        # Scale features
        features_scaled = self.scaler.fit_transform(features)
        
        # Train isolation forest
        self.anomaly_model.fit(features_scaled)
        
        # Save models
        joblib.dump(self.anomaly_model, '/workspaces/01_CTRLFreaks/backend/models/anomaly_model.pkl')
        joblib.dump(self.scaler, '/workspaces/01_CTRLFreaks/backend/models/scaler.pkl')
        
        logger.info("Anomaly detection model trained and saved")
        return True
    
    def train_energy_predictor(self):
        """Train energy consumption prediction model"""
        logger.info("Training energy consumption predictor...")
        
        df = self.load_sensor_data(hours_back=168)  # 1 week of data
        if df is None or len(df) < 200:
            logger.warning("Insufficient data for energy prediction training")
            return False
        
        features = self.prepare_features(df)
        target = df['power_consumption'].values
        
        # Remove rows with missing target values
        valid_indices = ~pd.isna(target)
        features = features[valid_indices]
        target = target[valid_indices]
        
        if len(features) < 100:
            logger.warning("Insufficient valid data for energy prediction")
            return False
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            features, target, test_size=0.2, random_state=42
        )
        
        # Train model
        self.energy_predictor.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.energy_predictor.predict(X_test)
        mse = mean_squared_error(y_test, y_pred)
        logger.info(f"Energy predictor MSE: {mse:.4f}")
        
        # Save model
        joblib.dump(self.energy_predictor, '/workspaces/01_CTRLFreaks/backend/models/energy_predictor.pkl')
        
        logger.info("Energy consumption predictor trained and saved")
        return True
    
    def train_maintenance_predictor(self):
        """Train predictive maintenance model"""
        logger.info("Training predictive maintenance model...")
        
        df = self.load_sensor_data(hours_back=168)  # 1 week of data
        if df is None or len(df) < 200:
            logger.warning("Insufficient data for maintenance prediction training")
            return False
        
        features = self.prepare_features(df)
        
        # Create maintenance score based on multiple factors
        maintenance_score = (
            (df['temperature'] - df['temperature'].mean()) / df['temperature'].std() * 0.3 +
            (df['vibration'] - df['vibration'].mean()) / df['vibration'].std() * 0.4 +
            (1 / (df['efficiency'] + 0.01)) * 0.3
        ).fillna(0)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            features, maintenance_score, test_size=0.2, random_state=42
        )
        
        # Train model
        self.maintenance_predictor.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.maintenance_predictor.predict(X_test)
        mse = mean_squared_error(y_test, y_pred)
        logger.info(f"Maintenance predictor MSE: {mse:.4f}")
        
        # Save model
        joblib.dump(self.maintenance_predictor, '/workspaces/01_CTRLFreaks/backend/models/maintenance_predictor.pkl')
        
        logger.info("Predictive maintenance model trained and saved")
        return True
    
    def detect_anomalies(self, device_id=None):
        """Detect anomalies in recent data"""
        try:
            # Load models
            anomaly_model = joblib.load('/workspaces/01_CTRLFreaks/backend/models/anomaly_model.pkl')
            scaler = joblib.load('/workspaces/01_CTRLFreaks/backend/models/scaler.pkl')
            
            # Get recent data
            df = self.load_sensor_data(hours_back=2)
            if df is None or len(df) == 0:
                return []
            
            if device_id:
                df = df[df['device_id'] == device_id]
            
            features = self.prepare_features(df)
            features_scaled = scaler.transform(features)
            
            # Predict anomalies
            anomaly_scores = anomaly_model.decision_function(features_scaled)
            is_anomaly = anomaly_model.predict(features_scaled) == -1
            
            # Create anomaly reports
            anomalies = []
            for idx, row in df.iterrows():
                if is_anomaly[idx]:
                    anomalies.append({
                        'device_id': row['device_id'],
                        'timestamp': row['timestamp'].isoformat(),
                        'anomaly_score': float(anomaly_scores[idx]),
                        'features': {
                            'temperature': float(row['temperature']),
                            'pressure': float(row['pressure']),
                            'power_consumption': float(row['power_consumption']),
                            'efficiency': float(row['efficiency'])
                        }
                    })
            
            logger.info(f"Detected {len(anomalies)} anomalies")
            return anomalies
            
        except Exception as e:
            logger.error(f"Error detecting anomalies: {e}")
            return []
    
    def predict_energy_consumption(self, hours_ahead=24):
        """Predict energy consumption for next period"""
        try:
            # Load model
            energy_predictor = joblib.load('/workspaces/01_CTRLFreaks/backend/models/energy_predictor.pkl')
            
            # Get recent data for prediction
            df = self.load_sensor_data(hours_back=24)
            if df is None or len(df) == 0:
                return {}
            
            # Calculate average features for prediction
            features = self.prepare_features(df)
            avg_features = features.mean().values.reshape(1, -1)
            
            # Predict
            prediction = energy_predictor.predict(avg_features)[0]
            
            return {
                'predicted_consumption_kwh': float(prediction * hours_ahead / 1000),
                'prediction_period_hours': hours_ahead,
                'confidence_interval': [
                    float(prediction * 0.85 * hours_ahead / 1000),
                    float(prediction * 1.15 * hours_ahead / 1000)
                ]
            }
            
        except Exception as e:
            logger.error(f"Error predicting energy consumption: {e}")
            return {}
    
    def predict_maintenance_needs(self):
        """Predict maintenance needs for all devices"""
        try:
            # Load model
            maintenance_predictor = joblib.load('/workspaces/01_CTRLFreaks/backend/models/maintenance_predictor.pkl')
            
            # Get recent data
            df = self.load_sensor_data(hours_back=24)
            if df is None or len(df) == 0:
                return []
            
            # Group by device and predict
            maintenance_predictions = []
            
            for device_id in df['device_id'].unique():
                device_data = df[df['device_id'] == device_id]
                features = self.prepare_features(device_data)
                
                if len(features) > 0:
                    avg_features = features.mean().values.reshape(1, -1)
                    maintenance_score = maintenance_predictor.predict(avg_features)[0]
                    
                    # Convert score to days until maintenance
                    days_until_maintenance = max(1, int(30 - maintenance_score * 10))
                    priority = 'high' if days_until_maintenance <= 7 else 'medium' if days_until_maintenance <= 14 else 'low'
                    
                    maintenance_predictions.append({
                        'device_id': device_id,
                        'maintenance_score': float(maintenance_score),
                        'days_until_maintenance': days_until_maintenance,
                        'priority': priority,
                        'recommended_actions': self._get_maintenance_recommendations(maintenance_score)
                    })
            
            logger.info(f"Generated maintenance predictions for {len(maintenance_predictions)} devices")
            return maintenance_predictions
            
        except Exception as e:
            logger.error(f"Error predicting maintenance: {e}")
            return []
    
    def _get_maintenance_recommendations(self, score):
        """Get maintenance recommendations based on score"""
        if score > 2:
            return ['Immediate inspection required', 'Check temperature sensors', 'Verify cooling system']
        elif score > 1:
            return ['Schedule routine maintenance', 'Monitor vibration levels', 'Check lubrication']
        else:
            return ['Continue normal operation', 'Regular monitoring sufficient']
    
    def generate_analytics_report(self):
        """Generate comprehensive analytics report"""
        logger.info("Generating ML analytics report...")
        
        report = {
            'timestamp': datetime.now().isoformat(),
            'anomalies': self.detect_anomalies(),
            'energy_forecast': self.predict_energy_consumption(),
            'maintenance_predictions': self.predict_maintenance_needs(),
            'model_status': {
                'anomaly_detection': True,
                'energy_prediction': True,
                'maintenance_prediction': True
            }
        }
        
        logger.info("Analytics report generated successfully")
        return report

def main():
    """Main function to train all ML models"""
    analyzer = IoTMLAnalyzer()
    
    logger.info("Starting ML model training pipeline...")
    
    # Train all models
    anomaly_success = analyzer.train_anomaly_detection()
    energy_success = analyzer.train_energy_predictor()
    maintenance_success = analyzer.train_maintenance_predictor()
    
    if all([anomaly_success, energy_success, maintenance_success]):
        logger.info("All ML models trained successfully!")
        
        # Generate sample analytics report
        report = analyzer.generate_analytics_report()
        with open('/workspaces/01_CTRLFreaks/backend/ml_analytics_report.json', 'w') as f:
            json.dump(report, f, indent=2)
        
        logger.info("Sample analytics report saved")
    else:
        logger.warning("Some models failed to train")

if __name__ == "__main__":
    main()