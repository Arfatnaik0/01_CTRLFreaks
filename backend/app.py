"""
Backend Flask Application for IoT Device Management
Handles sensor data, analytics, device control, and authentication
"""

from flask import Flask, request, jsonify, g
from flask_cors import CORS
from flask_login import LoginManager
import sqlite3
import json
import logging
from datetime import datetime, timedelta
import os
import secrets

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app():
    app = Flask(__name__)
    
    # Configure CORS for cross-origin requests with credentials
    CORS(app, 
         supports_credentials=True,
         origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],  # Allow frontend origins
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization"])
    
    # Configuration - use environment variables for production
    # Use persistent database even in production for data persistence
    app.config['DATABASE'] = os.environ.get('DATABASE_URL', 'iot_data.db')
    
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', secrets.token_hex(16))
    
    # Set Flask environment
    app.config['ENV'] = os.environ.get('FLASK_ENV', 'development')
    
    # Initialize Flask-Login
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    
    @login_manager.user_loader
    def load_user(user_id):
        from models.auth import User
        return User.find_by_id(int(user_id))
    
    # Auto-initialize database on startup for production
    if os.environ.get('FLASK_ENV') == 'production':
        with app.app_context():
            try:
                from models.database import init_db
                init_db()
                logger.info("Auto-initialized database on startup")
            except Exception as e:
                logger.error(f"Database auto-initialization failed: {e}")
    
    return app

app = create_app()

# Import routes and models
from models.database import init_db, get_db
from routes.sensor_routes import sensor_bp
from routes.analytics_routes import analytics_bp
from routes.control_routes import control_bp
from routes.auth_routes import auth_bp
from routes.notification_routes import notification_bp

# Register blueprints
app.register_blueprint(sensor_bp, url_prefix='/api')
app.register_blueprint(analytics_bp, url_prefix='/api')
app.register_blueprint(control_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(notification_bp, url_prefix='/api/notifications')

@app.route('/')
def index():
    """Health check endpoint"""
    return jsonify({
        "status": "running",
        "message": "IoT Backend API is running",
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/health')
def health():
    """Detailed health check"""
    try:
        # Check database connection
        db = get_db()
        db.execute('SELECT 1').fetchone()
        db_status = "healthy"
    except Exception as e:
        db_status = f"error: {str(e)}"
        # Try to initialize database if it doesn't exist
        try:
            init_db()
            db = get_db()
            db.execute('SELECT 1').fetchone()
            db_status = "initialized"
        except Exception as init_error:
            db_status = f"init_error: {str(init_error)}"
    
    return jsonify({
        "status": "healthy",
        "database": db_status,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/api/system-status')
def system_status():
    """Get overall system status including device connectivity"""
    try:
        from models.database import get_all_device_status
        
        devices = get_all_device_status()
        
        # Check if any devices are online (received data in last 30 seconds)
        thirty_seconds_ago = (datetime.now() - timedelta(seconds=30)).isoformat()
        online_devices = [d for d in devices if d.get('last_seen', '') > thirty_seconds_ago]
        
        system_online = len(online_devices) > 0
        
        return jsonify({
            "status": "success",
            "system_online": system_online,
            "total_devices": len(devices),
            "online_devices": len(online_devices),
            "offline_devices": len(devices) - len(online_devices),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error getting system status: {e}")
        return jsonify({
            "status": "error",
            "system_online": False,
            "message": str(e)
        }), 500

@app.route('/api/clear-offline-devices', methods=['POST'])
def clear_offline_devices():
    """Manually clear devices that haven't sent data in the last 30 seconds"""
    try:
        db = get_db()
        
        # Check if force parameter is provided
        force = request.args.get('force', 'false').lower() == 'true'
        
        if force:
            # Force delete ALL devices
            cursor = db.execute('DELETE FROM device_status')
            deleted_count = cursor.rowcount
            db.commit()
            
            return jsonify({
                "status": "success",
                "message": f"Force cleared ALL {deleted_count} devices",
                "deleted_count": deleted_count
            })
        else:
            # Delete devices offline for more than 30 seconds
            thirty_seconds_ago = (datetime.now() - timedelta(seconds=30)).isoformat()
            
            # Delete from device_status
            cursor = db.execute('''
                DELETE FROM device_status 
                WHERE last_seen < ?
            ''', (thirty_seconds_ago,))
            
            deleted_count = cursor.rowcount
            db.commit()
            
            return jsonify({
                "status": "success",
                "message": f"Cleared {deleted_count} offline devices",
                "deleted_count": deleted_count
            })
    except Exception as e:
        logger.error(f"Error clearing offline devices: {e}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/init-db')
def init_database():
    """Initialize database - useful for production deployment"""
    try:
        init_db()
        return jsonify({
            "status": "success",
            "message": "Database initialized successfully",
            "database_path": app.config['DATABASE'],
            "note": "Default admin user created - username: admin, password: admin"
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Database initialization failed: {str(e)}"
        }), 500

@app.route('/api/create-admin')
def create_admin():
    """Create default admin user for testing"""
    try:
        from models.auth import User
        
        # Check if admin already exists
        existing_admin = User.find_by_username('admin')
        if existing_admin:
            return jsonify({
                "status": "exists",
                "message": "Admin user already exists",
                "username": existing_admin.username,
                "role": existing_admin.role
            })
        
        # Create admin user
        admin_user = User.create_user(
            username='admin',
            email='admin@iot-control.com', 
            password='admin123',
            role='admin'
        )
        
        return jsonify({
            "status": "success",
            "message": "Admin user created successfully",
            "username": "admin",
            "password": "admin123"
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Failed to create admin user: {str(e)}"
        }), 500

@app.route('/api/debug-users')
def debug_users():
    """Debug endpoint to check user creation"""
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute('SELECT username, role, created_at FROM users')
        users = cursor.fetchall()
        
        return jsonify({
            "status": "success",
            "users": [dict(row) for row in users]
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.teardown_appcontext
def close_db(error):
    """Close database connection"""
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

if __name__ == '__main__':
    # Initialize database within app context
    with app.app_context():
        init_db()
    
    # Use environment PORT for deployment
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_ENV') != 'production'
    
    # Run the application
    app.run(host='0.0.0.0', port=port, debug=debug)