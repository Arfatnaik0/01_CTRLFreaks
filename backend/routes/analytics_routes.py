"""
Analytics routes for IoT backend
Provides data analysis, ML insights, and predictions
"""

from flask import Blueprint, request, jsonify
import sqlite3
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import logging
from analytics.ml_models import EnergyOptimizer, AnomalyDetector
from analytics.data_analyzer import DataAnalyzer

logger = logging.getLogger(__name__)
analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/analytics/overview', methods=['GET'])
def get_analytics_overview():
    """Get overall analytics overview"""
    try:
        hours = request.args.get('hours', 24, type=int)
        
        analyzer = DataAnalyzer()
        overview = analyzer.get_overview_analytics(hours)
        
        return jsonify({
            "status": "success",
            "timeframe_hours": hours,
            "analytics": overview
        }), 200
    
    except Exception as e:
        logger.error(f"Error getting analytics overview: {e}")
        return jsonify({"error": "Internal server error"}), 500

@analytics_bp.route('/analytics/energy', methods=['GET'])
def get_energy_analysis():
    """Get energy consumption analysis"""
    try:
        hours = request.args.get('hours', 24, type=int)
        
        analyzer = DataAnalyzer()
        energy_data = analyzer.analyze_energy_consumption(hours)
        
        return jsonify({
            "status": "success",
            "timeframe_hours": hours,
            "energy_analysis": energy_data
        }), 200
    
    except Exception as e:
        logger.error(f"Error getting energy analysis: {e}")
        return jsonify({"error": "Internal server error"}), 500

@analytics_bp.route('/analytics/alerts', methods=['GET'])
def get_current_alerts():
    """Get current system alerts"""
    try:
        analyzer = DataAnalyzer()
        alerts = analyzer.detect_alerts()
        
        return jsonify({
            "status": "success",
            "alert_count": len(alerts),
            "alerts": alerts
        }), 200
    
    except Exception as e:
        logger.error(f"Error getting alerts: {e}")
        return jsonify({"error": "Internal server error"}), 500

@analytics_bp.route('/analytics/trends', methods=['GET'])
def get_trends():
    """Get trend analysis for key metrics"""
    try:
        hours = request.args.get('hours', 168, type=int)  # Default 1 week
        
        analyzer = DataAnalyzer()
        trends = analyzer.analyze_trends(hours)
        
        return jsonify({
            "status": "success",
            "timeframe_hours": hours,
            "trends": trends
        }), 200
    
    except Exception as e:
        logger.error(f"Error getting trends: {e}")
        return jsonify({"error": "Internal server error"}), 500

@analytics_bp.route('/analytics/device/<device_id>/insights', methods=['GET'])
def get_device_insights(device_id):
    """Get detailed insights for a specific device"""
    try:
        hours = request.args.get('hours', 168, type=int)
        
        analyzer = DataAnalyzer()
        insights = analyzer.get_device_insights(device_id, hours)
        
        return jsonify({
            "status": "success",
            "device_id": device_id,
            "timeframe_hours": hours,
            "insights": insights
        }), 200
    
    except Exception as e:
        logger.error(f"Error getting device insights: {e}")
        return jsonify({"error": "Internal server error"}), 500

@analytics_bp.route('/analytics/optimization', methods=['GET'])
def get_energy_optimization():
    """Get energy optimization recommendations"""
    try:
        optimizer = EnergyOptimizer()
        recommendations = optimizer.get_optimization_recommendations()
        
        return jsonify({
            "status": "success",
            "recommendations": recommendations
        }), 200
    
    except Exception as e:
        logger.error(f"Error getting optimization recommendations: {e}")
        return jsonify({"error": "Internal server error"}), 500

@analytics_bp.route('/analytics/anomalies', methods=['GET'])
def detect_anomalies():
    """Detect anomalies in device behavior"""
    try:
        hours = request.args.get('hours', 24, type=int)
        
        detector = AnomalyDetector()
        anomalies = detector.detect_anomalies(hours)
        
        return jsonify({
            "status": "success",
            "timeframe_hours": hours,
            "anomaly_count": len(anomalies),
            "anomalies": anomalies
        }), 200
    
    except Exception as e:
        logger.error(f"Error detecting anomalies: {e}")
        return jsonify({"error": "Internal server error"}), 500

@analytics_bp.route('/analytics/predictions', methods=['GET'])
def get_predictions():
    """Get system failure predictions"""
    try:
        hours = request.args.get('hours', 24, type=int)
        
        detector = AnomalyDetector()
        predictions = detector.predict_failures(hours)
        
        return jsonify({
            "status": "success",
            "prediction_horizon_hours": hours,
            "predictions": predictions
        }), 200
    
    except Exception as e:
        logger.error(f"Error getting predictions: {e}")
        return jsonify({"error": "Internal server error"}), 500

@analytics_bp.route('/analytics/dashboard-data', methods=['GET'])
def get_dashboard_data():
    """Get comprehensive data for dashboard"""
    try:
        hours = request.args.get('hours', 24, type=int)
        
        analyzer = DataAnalyzer()
        
        # Get all dashboard data in one call for efficiency
        dashboard_data = {
            "overview": analyzer.get_overview_analytics(hours),
            "energy": analyzer.analyze_energy_consumption(hours),
            "alerts": analyzer.detect_alerts(),
            "trends": analyzer.analyze_trends(hours),
            "timestamp": datetime.now().isoformat()
        }
        
        return jsonify({
            "status": "success",
            "timeframe_hours": hours,
            "data": dashboard_data
        }), 200
    
    except Exception as e:
        logger.error(f"Error getting dashboard data: {e}")
        return jsonify({"error": "Internal server error"}), 500