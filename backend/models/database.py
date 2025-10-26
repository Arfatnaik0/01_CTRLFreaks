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
        import os
        
        database_path = current_app.config['DATABASE']
        
        # Create directory if it doesn't exist
        db_dir = os.path.dirname(database_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)
            logger.info(f"Created database directory: {db_dir}")
        
        g.sqlite_db = sqlite3.connect(database_path)
        g.sqlite_db.row_factory = sqlite3.Row
    return g.sqlite_db

def _create_tables(db):
    """Create all required tables in the database"""
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
            manual_override TEXT DEFAULT NULL,
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
    
    # Ensure manual_override column exists (for database migration)
    # Check if column exists by querying sqlite_master
    cursor = db.execute('''
        SELECT COUNT(*) as count FROM pragma_table_info('device_status') 
        WHERE name='manual_override'
    ''')
    column_exists = cursor.fetchone()[0] > 0
    
    if not column_exists:
        try:
            db.execute('ALTER TABLE device_status ADD COLUMN manual_override TEXT DEFAULT NULL')
            db.commit()
            logger.info("Added manual_override column to device_status table")
        except Exception as e:
            logger.warning(f"Could not add manual_override column (may already exist): {e}")
    
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

def _create_default_users(db):
    """Create default admin user if no users exist"""
    try:
        import bcrypt
        
        # Check if any users exist
        cursor = db.execute('SELECT COUNT(*) as count FROM users')
        user_count = cursor.fetchone()[0]
        
        if user_count == 0:
            # Create default admin user
            username = 'admin'
            email = 'admin@iot-control.com'
            password = 'admin123'  # Default password
            role = 'admin'
            
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            
            db.execute('''
                INSERT INTO users (username, email, password_hash, role, is_active, created_at)
                VALUES (?, ?, ?, ?, 1, datetime('now'))
            ''', (username, email, password_hash, role))
            
            db.commit()  # Ensure the user is saved
            logger.info(f"Created default admin user - username: {username}, password: {password}")
    except Exception as e:
        logger.error(f"Error creating default admin user: {e}")

def init_db():
    """Initialize database with tables"""
    try:
        # Use the configured database path from Flask config
        from flask import current_app
        import os
        
        database_path = current_app.config.get('DATABASE', 'iot_data.db')
        
        # Create directory if it doesn't exist (for production with persistent disk)
        db_dir = os.path.dirname(database_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)
            logger.info(f"Created database directory: {db_dir}")
        
        db = sqlite3.connect(database_path)
        db.row_factory = sqlite3.Row
        
        _create_tables(db)
        _create_default_users(db)
        
        db.close()
        
        logger.info(f"Database initialized successfully at {database_path}")
        
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise

def insert_sensor_reading(data):
    """Insert a new sensor reading with manual override support"""
    try:
        db = sqlite3.connect('iot_data.db')
        db.row_factory = sqlite3.Row
        
        # Check if there's a manual override for this device
        try:
            cursor = db.execute('''
                SELECT manual_override FROM device_status WHERE device_id = ?
            ''', (data['device_id'],))
            result = cursor.fetchone()
            manual_override = result['manual_override'] if result else None
        except sqlite3.OperationalError:
            # Column doesn't exist yet (old schema), use None
            manual_override = None
        
        # If manual override exists, use it instead of simulator's relay_status
        actual_relay_status = manual_override if manual_override else data['relay_status']
        
        # Insert sensor reading with actual relay status
        db.execute('''
            INSERT INTO sensor_readings 
            (device_id, timestamp, current, temperature, pressure, relay_status, 
             device_type, is_active, maintenance_required)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['device_id'], data['timestamp'], data['current'],
            data['temperature'], data['pressure'], actual_relay_status,
            data['device_type'], data['is_active'], data['maintenance_required']
        ))
        
        # Update or insert device status, preserving manual_override
        # Check if device exists
        cursor = db.execute('SELECT device_id, total_readings, avg_current, avg_temperature, avg_pressure FROM device_status WHERE device_id = ?', 
                          (data['device_id'],))
        existing = cursor.fetchone()
        
        if existing:
            # Update existing device
            total_readings = existing[1] + 1
            new_avg_current = (existing[2] * existing[1] + data['current']) / total_readings
            new_avg_temp = (existing[3] * existing[1] + data['temperature']) / total_readings
            new_avg_pressure = (existing[4] * existing[1] + data['pressure']) / total_readings
            
            try:
                # Try update with manual_override column
                db.execute('''
                    UPDATE device_status SET
                        last_seen = ?,
                        current_status = CASE WHEN ? = 1 THEN 'online' ELSE 'offline' END,
                        relay_status = COALESCE(manual_override, ?),
                        device_type = ?,
                        is_active = ?,
                        maintenance_required = ?,
                        total_readings = ?,
                        avg_current = ?,
                        avg_temperature = ?,
                        avg_pressure = ?,
                        updated_at = datetime('now')
                    WHERE device_id = ?
                ''', (data['timestamp'], data['is_active'], actual_relay_status,
                      data['device_type'], data['is_active'], data['maintenance_required'],
                      total_readings, new_avg_current, new_avg_temp, new_avg_pressure,
                      data['device_id']))
            except sqlite3.OperationalError:
                # Fallback without manual_override column
                db.execute('''
                    UPDATE device_status SET
                        last_seen = ?,
                        current_status = CASE WHEN ? = 1 THEN 'online' ELSE 'offline' END,
                        relay_status = ?,
                        device_type = ?,
                        is_active = ?,
                        maintenance_required = ?,
                        total_readings = ?,
                        avg_current = ?,
                        avg_temperature = ?,
                        avg_pressure = ?,
                        updated_at = datetime('now')
                    WHERE device_id = ?
                ''', (data['timestamp'], data['is_active'], actual_relay_status,
                      data['device_type'], data['is_active'], data['maintenance_required'],
                      total_readings, new_avg_current, new_avg_temp, new_avg_pressure,
                      data['device_id']))
        else:
            # Insert new device
            try:
                # Try insert with manual_override column
                db.execute('''
                    INSERT INTO device_status
                    (device_id, last_seen, current_status, relay_status, manual_override, device_type, 
                     is_active, maintenance_required, total_readings, avg_current, 
                     avg_temperature, avg_pressure, updated_at)
                    VALUES (?, ?, 
                        CASE WHEN ? = 1 THEN 'online' ELSE 'offline' END,
                        ?, NULL, ?, ?, ?, 1, ?, ?, ?, datetime('now'))
                ''', (data['device_id'], data['timestamp'], data['is_active'], actual_relay_status,
                      data['device_type'], data['is_active'], data['maintenance_required'],
                      data['current'], data['temperature'], data['pressure']))
            except sqlite3.OperationalError:
                # Fallback without manual_override column
                db.execute('''
                    INSERT INTO device_status
                    (device_id, last_seen, current_status, relay_status, device_type, 
                     is_active, maintenance_required, total_readings, avg_current, 
                     avg_temperature, avg_pressure, updated_at)
                    VALUES (?, ?, 
                        CASE WHEN ? = 1 THEN 'online' ELSE 'offline' END,
                        ?, ?, ?, ?, 1, ?, ?, ?, datetime('now'))
                ''', (data['device_id'], data['timestamp'], data['is_active'], actual_relay_status,
                      data['device_type'], data['is_active'], data['maintenance_required'],
                      data['current'], data['temperature'], data['pressure']))
        
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
    """Get status of all devices with offline detection and auto-cleanup"""
    try:
        db = sqlite3.connect('iot_data.db')
        db.row_factory = sqlite3.Row
        
        # Define offline threshold (30 seconds without data = offline)
        offline_threshold = (datetime.now() - timedelta(seconds=30)).isoformat()
        
        # AUTO-CLEANUP: Delete devices that have been offline for more than 1 minute
        # This ensures they don't reappear on page refresh
        one_minute_ago = (datetime.now() - timedelta(minutes=1)).isoformat()
        
        # Delete old sensor readings for offline devices to save space
        db.execute('''
            DELETE FROM sensor_readings 
            WHERE device_id IN (
                SELECT device_id FROM device_status WHERE last_seen < ?
            )
        ''', (one_minute_ago,))
        
        # Delete old device status records
        db.execute('''
            DELETE FROM device_status 
            WHERE last_seen < ?
        ''', (one_minute_ago,))
        
        db.commit()
        
        # Now get only the active devices
        cursor = db.execute('''
            SELECT *, 
                CASE 
                    WHEN last_seen < ? THEN 0
                    ELSE is_active
                END as is_active,
                CASE 
                    WHEN last_seen < ? THEN 'offline'
                    ELSE current_status
                END as current_status
            FROM device_status 
            ORDER BY device_id
        ''', (offline_threshold, offline_threshold))
        
        devices = [dict(row) for row in cursor.fetchall()]
        db.close()
        
        return devices
        
    except Exception as e:
        logger.error(f"Error getting device status: {e}")
        return []