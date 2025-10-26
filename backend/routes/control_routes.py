"""
Control routes for IoT backend
Handles device control commands and relay operations
"""

from flask import Blueprint, request, jsonify
import sqlite3
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
control_bp = Blueprint('control', __name__)

# In-memory command queue for demonstration
pending_commands = []

@control_bp.route('/control-commands', methods=['GET'])
def get_control_commands():
    """Get pending control commands for devices"""
    try:
        global pending_commands
        
        # Return and clear pending commands
        commands = pending_commands.copy()
        pending_commands = []
        
        return jsonify({
            "status": "success",
            "count": len(commands),
            "commands": commands
        }), 200
    
    except Exception as e:
        logger.error(f"Error getting control commands: {e}")
        return jsonify({"error": "Internal server error"}), 500

@control_bp.route('/device/<device_id>/control', methods=['POST'])
def control_device(device_id):
    """Send control command to a specific device"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No command data provided"}), 400
        
        action = data.get('action')
        if not action:
            return jsonify({"error": "No action specified"}), 400
        
        command = {
            "device_id": device_id,
            "action": action,
            "timestamp": datetime.now().isoformat()
        }
        
        # Handle different types of commands
        if action == 'toggle_relay':
            status = data.get('status', 'ON')
            if status not in ['ON', 'OFF']:
                return jsonify({"error": "Invalid relay status"}), 400
            command['status'] = status
            
        elif action == 'set_maintenance':
            required = data.get('required', False)
            command['required'] = required
            
        elif action == 'restart':
            command['restart_type'] = data.get('restart_type', 'soft')
            
        else:
            return jsonify({"error": f"Unknown action: {action}"}), 400
        
        # Add to pending commands queue
        global pending_commands
        pending_commands.append(command)
        
        # Store in database for audit trail
        db = sqlite3.connect('iot_data.db')
        db.execute('''
            INSERT INTO control_commands (device_id, command_type, command_data, status)
            VALUES (?, ?, ?, ?)
        ''', (device_id, action, json.dumps(command), 'sent'))
        db.commit()
        db.close()
        
        logger.info(f"Control command sent to device {device_id}: {action}")
        
        return jsonify({
            "status": "success",
            "message": f"Command sent to device {device_id}",
            "command": command
        }), 200
    
    except Exception as e:
        logger.error(f"Error sending control command: {e}")
        return jsonify({"error": "Internal server error"}), 500

@control_bp.route('/device/<device_id>/relay', methods=['PUT'])
def toggle_relay(device_id):
    """Toggle device relay (ON/OFF) with persistent state (backward compatible)"""
    try:
        data = request.get_json()
        status = data.get('relay_status') or data.get('status', 'ON')
        
        if status not in ['ON', 'OFF']:
            return jsonify({"error": "Invalid status. Use 'ON' or 'OFF'"}), 400
        
        # Save manual override in database with backward compatibility
        db = sqlite3.connect('iot_data.db', timeout=10)
        
        # Try to update with manual_override column first
        try:
            # Update or insert manual override
            db.execute('''
                UPDATE device_status 
                SET manual_override = ?, relay_status = ?, updated_at = datetime('now')
                WHERE device_id = ?
            ''', (status, status, device_id))
            
            # If device doesn't exist yet, create it
            if db.total_changes == 0:
                db.execute('''
                    INSERT OR IGNORE INTO device_status 
                    (device_id, last_seen, current_status, relay_status, manual_override, 
                     device_type, is_active, updated_at)
                    VALUES (?, datetime('now'), 'online', ?, ?, 'unknown', 1, datetime('now'))
                ''', (device_id, status, status))
        
        except sqlite3.OperationalError as e:
            # Column doesn't exist yet - use fallback without manual_override
            logger.warning(f"manual_override column not found, using fallback: {e}")
            db.execute('''
                UPDATE device_status 
                SET relay_status = ?, updated_at = datetime('now')
                WHERE device_id = ?
            ''', (status, device_id))
            
            # If device doesn't exist yet, create it without manual_override
            if db.total_changes == 0:
                db.execute('''
                    INSERT OR IGNORE INTO device_status 
                    (device_id, last_seen, current_status, relay_status, 
                     device_type, is_active, updated_at)
                    VALUES (?, datetime('now'), 'online', ?, 'unknown', 1, datetime('now'))
                ''', (device_id, status))
        
        db.commit()
        db.close()
        
        command = {
            "device_id": device_id,
            "action": "toggle_relay",
            "status": status,
            "timestamp": datetime.now().isoformat()
        }
        
        # Add to pending commands
        global pending_commands
        pending_commands.append(command)
        
        logger.info(f"Relay toggled for device {device_id}: {status}")
        
        return jsonify({
            "status": "success",
            "message": f"Device {device_id} has been turned {status.lower()} successfully",
            "command": command
        }), 200
    
    except Exception as e:
        logger.error(f"Error toggling relay for {device_id}: {e}", exc_info=True)
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@control_bp.route('/bulk-control', methods=['POST'])
def bulk_control():
    """Send control commands to multiple devices"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        device_ids = data.get('device_ids', [])
        action = data.get('action')
        
        if not device_ids:
            return jsonify({"error": "No device IDs provided"}), 400
        
        if not action:
            return jsonify({"error": "No action specified"}), 400
        
        commands_sent = []
        
        for device_id in device_ids:
            command = {
                "device_id": device_id,
                "action": action,
                "timestamp": datetime.now().isoformat()
            }
            
            # Add action-specific parameters
            if action == 'toggle_relay':
                command['status'] = data.get('status', 'ON')
            elif action == 'set_maintenance':
                command['required'] = data.get('required', False)
            
            # Add to pending commands
            global pending_commands
            pending_commands.append(command)
            commands_sent.append(command)
        
        logger.info(f"Bulk control command sent to {len(device_ids)} devices: {action}")
        
        return jsonify({
            "status": "success",
            "message": f"Commands sent to {len(device_ids)} devices",
            "commands": commands_sent
        }), 200
    
    except Exception as e:
        logger.error(f"Error with bulk control: {e}")
        return jsonify({"error": "Internal server error"}), 500

@control_bp.route('/emergency-stop', methods=['POST'])
def emergency_stop():
    """Emergency stop for all devices"""
    try:
        # Get all active devices
        db = sqlite3.connect('iot_data.db')
        db.row_factory = sqlite3.Row
        cursor = db.execute('SELECT device_id FROM device_status WHERE is_active = 1')
        active_devices = [row['device_id'] for row in cursor.fetchall()]
        db.close()
        
        # Send emergency stop to all active devices
        global pending_commands
        
        for device_id in active_devices:
            command = {
                "device_id": device_id,
                "action": "toggle_relay",
                "status": "OFF",
                "emergency": True,
                "timestamp": datetime.now().isoformat()
            }
            pending_commands.append(command)
        
        logger.warning(f"Emergency stop initiated for {len(active_devices)} devices")
        
        return jsonify({
            "status": "success",
            "message": f"Emergency stop sent to {len(active_devices)} devices",
            "affected_devices": len(active_devices)
        }), 200
    
    except Exception as e:
        logger.error(f"Error with emergency stop: {e}")
        return jsonify({"error": "Internal server error"}), 500

@control_bp.route('/command-history', methods=['GET'])
def get_command_history():
    """Get history of control commands"""
    try:
        limit = request.args.get('limit', 100, type=int)
        device_id = request.args.get('device_id')
        
        db = sqlite3.connect('iot_data.db')
        db.row_factory = sqlite3.Row
        
        if device_id:
            cursor = db.execute('''
                SELECT * FROM control_commands 
                WHERE device_id = ?
                ORDER BY created_at DESC 
                LIMIT ?
            ''', (device_id, limit))
        else:
            cursor = db.execute('''
                SELECT * FROM control_commands 
                ORDER BY created_at DESC 
                LIMIT ?
            ''', (limit,))
        
        commands = []
        for row in cursor.fetchall():
            cmd = dict(row)
            if cmd['command_data']:
                cmd['command_data'] = json.loads(cmd['command_data'])
            commands.append(cmd)
        
        db.close()
        
        return jsonify({
            "status": "success",
            "count": len(commands),
            "commands": commands
        }), 200
    
    except Exception as e:
        logger.error(f"Error getting command history: {e}")
        return jsonify({"error": "Internal server error"}), 500