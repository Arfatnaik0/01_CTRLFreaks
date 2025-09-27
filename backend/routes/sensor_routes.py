"""
Sensor data routes for IoT backend
Handles incoming sensor data and device status
"""

from flask import Blueprint, request, jsonify, current_app
import logging
from models.database import insert_sensor_reading, get_latest_readings, get_device_readings, get_all_device_status

logger = logging.getLogger(__name__)
sensor_bp = Blueprint('sensor', __name__)

@sensor_bp.route('/sensor-data', methods=['POST'])
def receive_sensor_data():
    """Receive sensor data from IoT devices"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Validate required fields
        required_fields = ['device_id', 'timestamp', 'current', 'temperature', 'pressure']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Insert into database
        if insert_sensor_reading(data):
            logger.debug(f"Sensor data received from device {data['device_id']}")
            return jsonify({"status": "success", "message": "Data received"}), 200
        else:
            return jsonify({"error": "Failed to store data"}), 500
    
    except Exception as e:
        logger.error(f"Error receiving sensor data: {e}")
        return jsonify({"error": "Internal server error"}), 500

@sensor_bp.route('/latest-readings', methods=['GET'])
def get_latest():
    """Get latest sensor readings"""
    try:
        limit = request.args.get('limit', 100, type=int)
        limit = min(limit, 1000)  # Cap at 1000 for performance
        
        readings = get_latest_readings(limit)
        
        return jsonify({
            "status": "success",
            "count": len(readings),
            "readings": readings
        }), 200
    
    except Exception as e:
        logger.error(f"Error getting latest readings: {e}")
        return jsonify({"error": "Internal server error"}), 500

@sensor_bp.route('/device/<device_id>/readings', methods=['GET'])
def get_device_data(device_id):
    """Get readings for a specific device"""
    try:
        hours = request.args.get('hours', 24, type=int)
        hours = min(hours, 168)  # Cap at 1 week
        
        readings = get_device_readings(device_id, hours)
        
        return jsonify({
            "status": "success",
            "device_id": device_id,
            "hours": hours,
            "count": len(readings),
            "readings": readings
        }), 200
    
    except Exception as e:
        logger.error(f"Error getting device readings: {e}")
        return jsonify({"error": "Internal server error"}), 500

@sensor_bp.route('/devices/status', methods=['GET'])
def get_devices_status():
    """Get status of all devices"""
    try:
        devices = get_all_device_status()
        
        # Calculate summary statistics
        total_devices = len(devices)
        active_devices = sum(1 for d in devices if d['is_active'])
        devices_on = sum(1 for d in devices if d['relay_status'] == 'ON')
        maintenance_needed = sum(1 for d in devices if d['maintenance_required'])
        
        return jsonify({
            "status": "success",
            "summary": {
                "total_devices": total_devices,
                "active_devices": active_devices,
                "devices_on": devices_on,
                "maintenance_needed": maintenance_needed
            },
            "devices": devices
        }), 200
    
    except Exception as e:
        logger.error(f"Error getting device status: {e}")
        return jsonify({"error": "Internal server error"}), 500

@sensor_bp.route('/devices/<device_id>/status', methods=['GET'])
def get_single_device_status(device_id):
    """Get status of a single device"""
    try:
        devices = get_all_device_status()
        device = next((d for d in devices if d['device_id'] == device_id), None)
        
        if not device:
            return jsonify({"error": "Device not found"}), 404
        
        return jsonify({
            "status": "success",
            "device": device
        }), 200
    
    except Exception as e:
        logger.error(f"Error getting device status: {e}")
        return jsonify({"error": "Internal server error"}), 500