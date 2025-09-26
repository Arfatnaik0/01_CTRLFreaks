# ML Analytics API Extension for Flask
import sys
import os
sys.path.append('/workspaces/01_CTRLFreaks/backend')

from flask import jsonify
from ml_analyzer import IoTMLAnalyzer
import json
from datetime import datetime

def init_ml_routes(app):
    """Initialize ML analytics routes"""
    
    @app.route('/api/ml/analytics', methods=['GET'])
    def get_ml_analytics():
        """Get comprehensive ML analytics report"""
        try:
            analyzer = IoTMLAnalyzer()
            report = analyzer.generate_analytics_report()
            return jsonify(report)
        except Exception as e:
            return jsonify({'error': f'ML analytics error: {str(e)}'}), 500
    
    @app.route('/api/ml/anomalies', methods=['GET'])
    def get_anomalies():
        """Get recent anomaly detections"""
        try:
            analyzer = IoTMLAnalyzer()
            anomalies = analyzer.detect_anomalies()
            return jsonify({
                'anomalies': anomalies,
                'count': len(anomalies),
                'timestamp': datetime.now().isoformat()
            })
        except Exception as e:
            return jsonify({'error': f'Anomaly detection error: {str(e)}'}), 500
    
    @app.route('/api/ml/energy-forecast', methods=['GET'])
    def get_energy_forecast():
        """Get energy consumption predictions"""
        try:
            analyzer = IoTMLAnalyzer()
            forecast = analyzer.predict_energy_consumption(hours_ahead=24)
            return jsonify({
                'forecast': forecast,
                'timestamp': datetime.now().isoformat()
            })
        except Exception as e:
            return jsonify({'error': f'Energy prediction error: {str(e)}'}), 500
    
    @app.route('/api/ml/maintenance', methods=['GET'])
    def get_maintenance_predictions():
        """Get predictive maintenance recommendations"""
        try:
            analyzer = IoTMLAnalyzer()
            predictions = analyzer.predict_maintenance_needs()
            return jsonify({
                'predictions': predictions,
                'count': len(predictions),
                'timestamp': datetime.now().isoformat()
            })
        except Exception as e:
            return jsonify({'error': f'Maintenance prediction error: {str(e)}'}), 500
    
    @app.route('/api/ml/device-anomalies/<device_id>', methods=['GET'])
    def get_device_anomalies(device_id):
        """Get anomalies for a specific device"""
        try:
            analyzer = IoTMLAnalyzer()
            anomalies = analyzer.detect_anomalies(device_id=device_id)
            return jsonify({
                'device_id': device_id,
                'anomalies': anomalies,
                'count': len(anomalies),
                'timestamp': datetime.now().isoformat()
            })
        except Exception as e:
            return jsonify({'error': f'Device anomaly detection error: {str(e)}'}), 500