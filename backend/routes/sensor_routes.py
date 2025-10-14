"""
Sensor data routes for IoT backend
Handles incoming sensor data and device status with multi-tenant support
"""

from flask import Blueprint, request, jsonify, current_app, g
from flask_login import login_required, current_user
import logging
from models.database import insert_sensor_reading, get_latest_readings, get_device_readings, get_all_device_status, get_db
from models.tenant import TenantMiddleware

logger = logging.getLogger(__name__)
sensor_bp = Blueprint('sensor', __name__)

@sensor_bp.route('/sensor-data', methods=['POST'])
def receive_sensor_data():
    """Receive sensor data from IoT devices with robust error handling"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Validate required fields
        required_fields = ['device_id', 'timestamp', 'current', 'temperature', 'pressure']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Get tenant_id from request or default to factory_a for simulator
        tenant_id = data.get('tenant_id', 'factory_a')
        data['tenant_id'] = tenant_id
        
        # Ensure all required fields have default values
        data.setdefault('relay_status', 'ON')
        data.setdefault('device_type', 'generic')
        data.setdefault('is_active', True)
        data.setdefault('maintenance_required', False)
        
        # Try to insert into database with error recovery
        try:
            if insert_sensor_reading(data):
                logger.debug(f"Sensor data received from device {data['device_id']} for tenant {tenant_id}")
                return jsonify({"status": "success", "message": "Data received", "tenant_id": tenant_id}), 200
            else:
                return jsonify({"error": "Failed to store data"}), 500
        except Exception as db_error:
            logger.error(f"Database error: {db_error}")
            # Try to reinitialize database and retry
            try:
                from models.database import init_db
                init_db()
                if insert_sensor_reading(data):
                    logger.info("Database reinitialized and data stored successfully")
                    return jsonify({"status": "success", "message": "Data received after DB recovery", "tenant_id": tenant_id}), 200
            except Exception as retry_error:
                logger.error(f"Database recovery failed: {retry_error}")
            
            return jsonify({"error": "Database temporarily unavailable"}), 503
    
    except Exception as e:
        logger.error(f"Error receiving sensor data: {e}")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

@sensor_bp.route('/latest-readings', methods=['GET'])
@login_required
def get_latest():
    """Get latest sensor readings for current tenant"""
    try:
        limit = request.args.get('limit', 100, type=int)
        limit = min(limit, 1000)  # Cap at 1000 for performance
        
        # Get tenant-specific readings
        tenant_id = getattr(current_user, 'tenant_id', 'factory_a')
        
        # Override for super admin to see all data
        if getattr(current_user, 'role', '') == 'super_admin':
            readings = get_latest_readings(limit)
        else:
            # Get tenant-specific readings
            db = get_db()
            cursor = db.execute('''
                SELECT * FROM sensor_readings 
                WHERE tenant_id = ?
                ORDER BY timestamp DESC 
                LIMIT ?
            ''', (tenant_id, limit))
            readings = [dict(row) for row in cursor.fetchall()]
        
        return jsonify({
            "status": "success",
            "tenant_id": tenant_id,
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
        limit = request.args.get('limit', 100, type=int)
        hours = min(hours, 168)  # Cap at 1 week
        limit = min(limit, 1000)  # Cap at 1000 for performance
        
        readings = get_device_readings(device_id, hours, limit)
        
        return jsonify({
            "status": "success",
            "device_id": device_id,
            "hours": hours,
            "limit": limit,
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