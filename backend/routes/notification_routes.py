"""
Notification routes for IoT backend
Handles email notifications and alerts
"""

from flask import Blueprint, jsonify
import logging
from models.database import get_all_device_status
from services.email_service import email_service

logger = logging.getLogger(__name__)
notification_bp = Blueprint('notification', __name__)

@notification_bp.route('/check-critical-sensors', methods=['POST'])
def check_critical_sensors():
    """Check for critical sensors and send email notification"""
    try:
        # Get all device status
        devices = get_all_device_status()
        
        # Filter critical devices (current > 15A or temp > 30°C)
        critical_devices = []
        for device in devices:
            avg_current = device.get('avg_current', 0)
            avg_temp = device.get('avg_temperature', 0)
            
            # Consider as critical if exceeds warning thresholds
            if avg_current > 15 or avg_temp > 30:
                critical_devices.append(device)
        
        if critical_devices:
            # Send email notification
            email_sent = email_service.send_critical_sensor_alert(critical_devices)
            
            return jsonify({
                "status": "success",
                "message": f"Found {len(critical_devices)} critical sensors",
                "critical_count": len(critical_devices),
                "email_sent": email_sent,
                "devices": [d['device_id'] for d in critical_devices]
            }), 200
        else:
            return jsonify({
                "status": "success",
                "message": "No critical sensors detected",
                "critical_count": 0,
                "email_sent": False
            }), 200
            
    except Exception as e:
        logger.error(f"Error checking critical sensors: {e}")
        return jsonify({"error": "Internal server error"}), 500


@notification_bp.route('/test-email', methods=['POST'])
def test_email():
    """Test email configuration by sending a test email"""
    try:
        # Create a test device list
        test_devices = [{
            'device_id': 'TEST_001',
            'device_type': 'test_sensor',
            'avg_current': 18.5,
            'avg_temperature': 32.5,
            'avg_pressure': 3.2,
            'maintenance_required': True
        }]
        
        email_sent = email_service.send_critical_sensor_alert(test_devices)
        
        return jsonify({
            "status": "success",
            "message": "Test email sent" if email_sent else "Email not configured",
            "email_sent": email_sent
        }), 200
        
    except Exception as e:
        logger.error(f"Error sending test email: {e}")
        return jsonify({"error": str(e)}), 500
