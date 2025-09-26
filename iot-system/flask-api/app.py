from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
import redis
from datetime import datetime, timedelta
import json
import sys

# Add backend to path for ML imports
sys.path.append('/workspaces/01_CTRLFreaks/backend')

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://iot_user:iot_password@localhost:5432/iot_energy_db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
redis_client = redis.Redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379'))

# Database Models
class Device(db.Model):
    __tablename__ = 'devices'
    
    device_id = db.Column(db.String(50), primary_key=True)
    device_type = db.Column(db.String(50), nullable=False)
    location = db.Column(db.String(100), nullable=False)
    manufacturer = db.Column(db.String(50))
    model = db.Column(db.String(50))
    installation_date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='active')
    max_current = db.Column(db.Float)
    max_temperature = db.Column(db.Float)
    max_pressure = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class SensorData(db.Model):
    __tablename__ = 'sensor_data'
    
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.String(50), db.ForeignKey('devices.device_id'))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    current_value = db.Column(db.Float, nullable=False)
    temperature = db.Column(db.Float, nullable=False)
    pressure = db.Column(db.Float, nullable=False)
    energy_consumption = db.Column(db.Float)
    status = db.Column(db.String(20), default='normal')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Alert(db.Model):
    __tablename__ = 'alerts'
    
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.String(50), db.ForeignKey('devices.device_id'))
    alert_type = db.Column(db.String(50), nullable=False)
    severity = db.Column(db.String(20), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_resolved = db.Column(db.Boolean, default=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    resolved_at = db.Column(db.DateTime)

# API Routes
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'services': {
            'database': check_database_connection(),
            'redis': check_redis_connection()
        }
    })

@app.route('/api/devices', methods=['GET'])
def get_devices():
    """Get all devices"""
    devices = Device.query.all()
    return jsonify([{
        'device_id': device.device_id,
        'device_type': device.device_type,
        'location': device.location,
        'manufacturer': device.manufacturer,
        'model': device.model,
        'status': device.status,
        'max_current': device.max_current,
        'max_temperature': device.max_temperature,
        'max_pressure': device.max_pressure
    } for device in devices])

@app.route('/api/devices/<device_id>', methods=['GET'])
def get_device(device_id):
    """Get specific device details"""
    device = Device.query.get_or_404(device_id)
    return jsonify({
        'device_id': device.device_id,
        'device_type': device.device_type,
        'location': device.location,
        'manufacturer': device.manufacturer,
        'model': device.model,
        'status': device.status,
        'max_current': device.max_current,
        'max_temperature': device.max_temperature,
        'max_pressure': device.max_pressure
    })

@app.route('/api/devices/<device_id>/sensor-data', methods=['GET'])
def get_device_sensor_data(device_id):
    """Get recent sensor data for a device"""
    # Get query parameters
    hours = request.args.get('hours', 24, type=int)
    limit = request.args.get('limit', 1000, type=int)
    
    # Calculate time range
    start_time = datetime.utcnow() - timedelta(hours=hours)
    
    # Query sensor data
    sensor_data = SensorData.query.filter(
        SensorData.device_id == device_id,
        SensorData.timestamp >= start_time
    ).order_by(SensorData.timestamp.desc()).limit(limit).all()
    
    return jsonify([{
        'timestamp': data.timestamp.isoformat(),
        'current_value': data.current_value,
        'temperature': data.temperature,
        'pressure': data.pressure,
        'energy_consumption': data.energy_consumption,
        'status': data.status
    } for data in sensor_data])

@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    """Get recent alerts"""
    # Get query parameters
    active_only = request.args.get('active_only', 'false').lower() == 'true'
    limit = request.args.get('limit', 100, type=int)
    
    # Build query
    query = Alert.query
    if active_only:
        query = query.filter(Alert.is_resolved == False)
    
    alerts = query.order_by(Alert.timestamp.desc()).limit(limit).all()
    
    return jsonify([{
        'id': alert.id,
        'device_id': alert.device_id,
        'alert_type': alert.alert_type,
        'severity': alert.severity,
        'message': alert.message,
        'is_resolved': alert.is_resolved,
        'timestamp': alert.timestamp.isoformat(),
        'resolved_at': alert.resolved_at.isoformat() if alert.resolved_at else None
    } for alert in alerts])

@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Get dashboard statistics"""
    # Get cached stats from Redis first
    cached_stats = redis_client.get('dashboard_stats')
    if cached_stats:
        return jsonify(json.loads(cached_stats))
    
    # Calculate stats
    total_devices = Device.query.count()
    active_devices = Device.query.filter(Device.status == 'active').count()
    active_alerts = Alert.query.filter(Alert.is_resolved == False).count()
    
    # Get recent energy consumption
    recent_consumption = db.session.query(
        db.func.sum(SensorData.energy_consumption)
    ).filter(
        SensorData.timestamp >= datetime.utcnow() - timedelta(hours=24)
    ).scalar() or 0
    
    stats = {
        'total_devices': total_devices,
        'active_devices': active_devices,
        'inactive_devices': total_devices - active_devices,
        'active_alerts': active_alerts,
        'daily_energy_consumption': round(recent_consumption, 2),
        'last_updated': datetime.utcnow().isoformat()
    }
    
    # Cache for 5 minutes
    redis_client.setex('dashboard_stats', 300, json.dumps(stats))
    
    return jsonify(stats)

@app.route('/api/devices/<device_id>/control', methods=['POST'])
def control_device(device_id):
    """Control device (turn on/off, etc.)"""
    data = request.get_json()
    action = data.get('action')  # 'on', 'off', 'restart'
    
    if not action:
        return jsonify({'error': 'Action is required'}), 400
    
    # Validate device exists
    device = Device.query.get_or_404(device_id)
    
    # TODO: Implement actual control logic
    # For now, just simulate the response
    result = {
        'device_id': device_id,
        'action': action,
        'status': 'success',
        'timestamp': datetime.utcnow().isoformat(),
        'message': f'Device {device_id} {action} command executed successfully'
    }
    
    return jsonify(result)

@app.route('/api/system-stats', methods=['GET'])
def get_system_stats():
    """Get comprehensive system statistics"""
    try:
        # Get device counts
        total_devices = db.session.query(Device).count()
        active_devices = db.session.query(Device).filter(Device.status == 'active').count()
        
        # Get alert counts
        total_alerts = db.session.query(Alert).count()
        active_alerts = db.session.query(Alert).filter(Alert.is_resolved == False).count()
        
        # Get recent sensor data for energy calculation
        recent_data = db.session.query(SensorData)\
            .filter(SensorData.timestamp >= datetime.utcnow() - timedelta(days=1))\
            .all()
        
        # Calculate energy consumption (mock calculation)
        total_energy = sum([reading.current_value * 0.24 for reading in recent_data]) / 1000  # Convert to kWh
        
        # Calculate average efficiency (mock calculation)
        if recent_data:
            avg_temp = sum([reading.temperature for reading in recent_data]) / len(recent_data)
            avg_current = sum([reading.current_value for reading in recent_data]) / len(recent_data)
            efficiency = max(0, min(100, 100 - (avg_temp - 50) * 0.5 - (avg_current - 10) * 0.3))
        else:
            efficiency = 85.0
        
        # Calculate uptime (mock - assume 99%+ uptime)
        uptime = 99.2 + (active_devices / total_devices * 0.8) if total_devices > 0 else 99.2
        
        # Count data points today
        today_data = db.session.query(SensorData)\
            .filter(SensorData.timestamp >= datetime.utcnow().replace(hour=0, minute=0, second=0))\
            .count()
        
        # Count anomalies (alerts created today)
        today_anomalies = db.session.query(Alert)\
            .filter(Alert.timestamp >= datetime.utcnow().replace(hour=0, minute=0, second=0))\
            .count()
        
        # Mock maintenance due count
        maintenance_due = max(0, total_devices - active_devices)
        
        stats = {
            'total_devices': total_devices,
            'active_devices': active_devices,
            'total_alerts': total_alerts,
            'active_alerts': active_alerts,
            'total_energy_consumption': round(total_energy, 2),
            'average_efficiency': round(efficiency, 1),
            'uptime_percentage': round(uptime, 1),
            'data_points_today': today_data,
            'anomalies_detected': today_anomalies,
            'maintenance_due': maintenance_due,
            'last_updated': datetime.utcnow().isoformat()
        }
        
        return jsonify(stats)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/energy-data', methods=['GET'])
def get_energy_data():
    """Get energy consumption data for charts"""
    try:
        # Get time range parameter
        hours = request.args.get('hours', 24, type=int)
        start_time = datetime.utcnow() - timedelta(hours=hours)
        
        # Query sensor data
        sensor_data = db.session.query(SensorData)\
            .filter(SensorData.timestamp >= start_time)\
            .order_by(SensorData.timestamp.desc())\
            .limit(100)\
            .all()
        
        # Group by hour and calculate averages
        hourly_data = {}
        for reading in sensor_data:
            hour_key = reading.timestamp.strftime('%H:00')
            if hour_key not in hourly_data:
                hourly_data[hour_key] = {
                    'current': [],
                    'temperature': [],
                    'energy': []
                }
            hourly_data[hour_key]['current'].append(reading.current_value)
            hourly_data[hour_key]['temperature'].append(reading.temperature)
            hourly_data[hour_key]['energy'].append(reading.current_value * 0.24 / 1000)
        
        # Calculate averages
        chart_data = {
            'labels': [],
            'current_data': [],
            'temperature_data': [],
            'energy_data': []
        }
        
        for hour in sorted(hourly_data.keys()):
            data = hourly_data[hour]
            chart_data['labels'].append(hour)
            chart_data['current_data'].append(round(sum(data['current']) / len(data['current']), 2))
            chart_data['temperature_data'].append(round(sum(data['temperature']) / len(data['temperature']), 1))
            chart_data['energy_data'].append(round(sum(data['energy']), 3))
        
        return jsonify(chart_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def check_database_connection():
    """Check database connectivity"""
    try:
        db.session.execute(db.text('SELECT 1'))
        return 'connected'
    except Exception as e:
        return f'error: {str(e)}'

def check_redis_connection():
    """Check Redis connectivity"""
    try:
        redis_client.ping()
        return 'connected'
    except Exception as e:
        return f'error: {str(e)}'

# ML Analytics Routes
@app.route('/api/ml/analytics', methods=['GET'])
def get_ml_analytics():
    """Get comprehensive ML analytics report"""
    try:
        from ml_analyzer import IoTMLAnalyzer
        analyzer = IoTMLAnalyzer()
        report = analyzer.generate_analytics_report()
        return jsonify(report)
    except Exception as e:
        return jsonify({'error': f'ML analytics error: {str(e)}'}), 500

@app.route('/api/ml/anomalies', methods=['GET'])
def get_anomalies():
    """Get recent anomaly detections"""
    try:
        from ml_analyzer import IoTMLAnalyzer
        analyzer = IoTMLAnalyzer()
        anomalies = analyzer.detect_anomalies()
        return jsonify({
            'anomalies': anomalies,
            'count': len(anomalies),
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        return jsonify({'error': f'Anomaly detection error: {str(e)}'}), 500

@app.route('/api/ml/energy-forecast', methods=['GET'])
def get_energy_forecast():
    """Get energy consumption predictions"""
    try:
        from ml_analyzer import IoTMLAnalyzer
        analyzer = IoTMLAnalyzer()
        forecast = analyzer.predict_energy_consumption(hours_ahead=24)
        return jsonify({
            'forecast': forecast,
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        return jsonify({'error': f'Energy prediction error: {str(e)}'}), 500

@app.route('/api/ml/maintenance', methods=['GET'])
def get_maintenance_predictions():
    """Get predictive maintenance recommendations"""
    try:
        from ml_analyzer import IoTMLAnalyzer
        analyzer = IoTMLAnalyzer()
        predictions = analyzer.predict_maintenance_needs()
        return jsonify({
            'predictions': predictions,
            'count': len(predictions),
            'timestamp': datetime.utcnow().isoformat()
        })
    except Exception as e:
        return jsonify({'error': f'Maintenance prediction error: {str(e)}'}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    
    app.run(host='0.0.0.0', port=5000, debug=True)