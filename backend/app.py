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
    # Use file-based database for production reliability on Render
    app.config['DATABASE'] = os.environ.get('DATABASE_URL', 'iot_data.db')
    
    # For Render deployment, use /tmp directory for database
    if 'onrender.com' in os.environ.get('RENDER_EXTERNAL_URL', ''):
        app.config['DATABASE'] = '/tmp/iot_data.db'
    
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
    
    # Auto-initialize database on startup for production (always initialize for Render)
    with app.app_context():
        try:
            from models.database import init_db
            from models.tenant import TenantManager
            init_db()
            TenantManager.create_tenant_system()
            logger.info("Auto-initialized database and tenant system on startup")
        except Exception as e:
            logger.error(f"Database auto-initialization failed: {e}")
            # Try one more time with clean initialization
            try:
                init_db()
                logger.info("Database initialized successfully on retry")
            except Exception as retry_error:
                logger.error(f"Database retry failed: {retry_error}")
    
    return app

app = create_app()

# Import routes and models
from models.database import init_db, get_db
from routes.sensor_routes import sensor_bp
from routes.analytics_routes import analytics_bp
from routes.control_routes import control_bp
from routes.auth_routes import auth_bp
from routes.super_admin_routes import super_admin_bp

# Register blueprints
app.register_blueprint(sensor_bp, url_prefix='/api')
app.register_blueprint(analytics_bp, url_prefix='/api')
app.register_blueprint(control_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(super_admin_bp, url_prefix='/api/super-admin')

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

@app.route('/api/init-db')
def init_database():
    """Initialize database with multi-tenant support - useful for production deployment"""
    try:
        from models.tenant import TenantManager
        init_db()
        TenantManager.create_tenant_system()
        return jsonify({
            "status": "success",
            "message": "Database and tenant system initialized successfully",
            "database_path": app.config['DATABASE'],
            "credentials": {
                "super_admin": "superadmin / superadmin123",
                "factory_admins": "admin_a, admin_b, admin_c, admin_d / factory123",
                "legacy_admin": "admin / admin (for backward compatibility)"
            }
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