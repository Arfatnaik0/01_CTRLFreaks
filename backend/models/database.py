"""
Database models and utilities for IoT system
"""

import sqlite3
import logging
from flask import g, current_app
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

def get_db():
    """Get database connection"""
    if not hasattr(g, 'sqlite_db'):
        g.sqlite_db = sqlite3.connect(current_app.config['DATABASE'])
        g.sqlite_db.row_factory = sqlite3.Row
    return g.sqlite_db

def init_db():
    """Initialize database with tables"""
    try:
        # Use the configured database path from Flask config
        from flask import current_app
        database_path = current_app.config.get('DATABASE', 'iot_data.db')
        db = sqlite3.connect(database_path)
        db.row_factory = sqlite3.Row
        
        # Create sensor_readings table
        db.execute('''
            CREATE TABLE IF NOT EXISTS sensor_readings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                current REAL NOT NULL,
                temperature REAL NOT NULL,
                pressure REAL NOT NULL,
                relay_status TEXT NOT NULL,
                device_type TEXT NOT NULL,
                is_active BOOLEAN NOT NULL,
                maintenance_required BOOLEAN NOT NULL DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create device_status table
        db.execute('''
            CREATE TABLE IF NOT EXISTS device_status (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT UNIQUE NOT NULL,
                last_seen TEXT NOT NULL,
                current_status TEXT NOT NULL,
                relay_status TEXT NOT NULL,
                device_type TEXT NOT NULL,
                is_active BOOLEAN NOT NULL,
                maintenance_required BOOLEAN NOT NULL DEFAULT 0,
                total_readings INTEGER DEFAULT 0,
                avg_current REAL DEFAULT 0,
                avg_temperature REAL DEFAULT 0,
                avg_pressure REAL DEFAULT 0,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create control_commands table
        db.execute('''
            CREATE TABLE IF NOT EXISTS control_commands (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                command_type TEXT NOT NULL,
                command_data TEXT,
                status TEXT DEFAULT 'pending',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                executed_at TEXT
            )
        ''')
        
        # Create analytics_cache table for performance
        db.execute('''
            CREATE TABLE IF NOT EXISTS analytics_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cache_key TEXT UNIQUE NOT NULL,
                cache_data TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create alerts table
        db.execute('''
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                alert_type TEXT NOT NULL,
                severity TEXT NOT NULL,
                message TEXT NOT NULL,
                value REAL,
                threshold REAL,
                acknowledged BOOLEAN DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                acknowledged_at TEXT
            )
        ''')
        
        # Create users table for authentication
        db.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash BLOB NOT NULL,
                role TEXT NOT NULL DEFAULT 'operator',
                is_active BOOLEAN NOT NULL DEFAULT 1,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                last_login TEXT
            )
        ''')
        
        # Create indexes for better performance
        db.execute('CREATE INDEX IF NOT EXISTS idx_sensor_device_timestamp ON sensor_readings(device_id, timestamp)')
        db.execute('CREATE INDEX IF NOT EXISTS idx_sensor_timestamp ON sensor_readings(timestamp)')
        db.execute('CREATE INDEX IF NOT EXISTS idx_device_status_device_id ON device_status(device_id)')
        db.execute('CREATE INDEX IF NOT EXISTS idx_alerts_device_timestamp ON alerts(device_id, created_at)')
        db.execute('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)')
        db.execute('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)')
        
        db.commit()
        db.close()
        
        logger.info("Database initialized successfully")
        
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise

def insert_sensor_reading(data):
    """Insert a new sensor reading"""
    try:
        db = sqlite3.connect('iot_data.db')
        
        # Insert sensor reading
        db.execute('''
            INSERT INTO sensor_readings 
            (device_id, timestamp, current, temperature, pressure, relay_status, 
             device_type, is_active, maintenance_required)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['device_id'], data['timestamp'], data['current'],
            data['temperature'], data['pressure'], data['relay_status'],
            data['device_type'], data['is_active'], data['maintenance_required']
        ))
        
        # Update or insert device status
        db.execute('''
            INSERT OR REPLACE INTO device_status
            (device_id, last_seen, current_status, relay_status, device_type, 
             is_active, maintenance_required, total_readings, avg_current, 
             avg_temperature, avg_pressure, updated_at)
            SELECT 
                ?,
                ?,
                CASE WHEN ? = 1 THEN 'online' ELSE 'offline' END,
                ?,
                ?,
                ?,
                ?,
                COALESCE((SELECT total_readings FROM device_status WHERE device_id = ?), 0) + 1,
                (COALESCE((SELECT avg_current * total_readings FROM device_status WHERE device_id = ?), 0) + ?) / 
                 (COALESCE((SELECT total_readings FROM device_status WHERE device_id = ?), 0) + 1),
                (COALESCE((SELECT avg_temperature * total_readings FROM device_status WHERE device_id = ?), 0) + ?) / 
                 (COALESCE((SELECT total_readings FROM device_status WHERE device_id = ?), 0) + 1),
                (COALESCE((SELECT avg_pressure * total_readings FROM device_status WHERE device_id = ?), 0) + ?) / 
                 (COALESCE((SELECT total_readings FROM device_status WHERE device_id = ?), 0) + 1),
                ?
        ''', (
            data['device_id'], data['timestamp'], data['is_active'], data['relay_status'],
            data['device_type'], data['is_active'], data['maintenance_required'],
            data['device_id'], data['device_id'], data['current'], data['device_id'],
            data['device_id'], data['temperature'], data['device_id'],
            data['device_id'], data['pressure'], data['device_id'],
            datetime.now().isoformat()
        ))
        
        db.commit()
        db.close()
        
        return True
        
    except Exception as e:
        logger.error(f"Error inserting sensor reading: {e}")
        return False

def get_latest_readings(limit=100):
    """Get latest sensor readings"""
    try:
        db = sqlite3.connect('iot_data.db')
        db.row_factory = sqlite3.Row
        
        cursor = db.execute('''
            SELECT * FROM sensor_readings 
            ORDER BY timestamp DESC 
            LIMIT ?
        ''', (limit,))
        
        readings = [dict(row) for row in cursor.fetchall()]
        db.close()
        
        return readings
        
    except Exception as e:
        logger.error(f"Error getting latest readings: {e}")
        return []

def get_device_readings(device_id, hours=24, limit=100):
    """Get readings for a specific device"""
    try:
        db = sqlite3.connect('iot_data.db')
        db.row_factory = sqlite3.Row
        
        since = (datetime.now() - timedelta(hours=hours)).isoformat()
        
        cursor = db.execute('''
            SELECT * FROM sensor_readings 
            WHERE device_id = ? AND timestamp > ?
            ORDER BY timestamp DESC
            LIMIT ?
        ''', (device_id, since, limit))
        
        readings = [dict(row) for row in cursor.fetchall()]
        db.close()
        
        return readings
        
    except Exception as e:
        logger.error(f"Error getting device readings: {e}")
        return []

def get_all_device_status():
    """Get status of all devices"""
    try:
        db = sqlite3.connect('iot_data.db')
        db.row_factory = sqlite3.Row
        
        cursor = db.execute('''
            SELECT * FROM device_status 
            ORDER BY device_id
        ''')
        
        devices = [dict(row) for row in cursor.fetchall()]
        db.close()
        
        return devices
        
    except Exception as e:
        logger.error(f"Error getting device status: {e}")
        return []