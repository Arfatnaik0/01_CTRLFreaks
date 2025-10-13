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
    CORS(app, supports_credentials=True)  # Enable CORS with credentials for React frontend
    
    # Configuration - use environment variables
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
    
    return app

app = create_app()

# Import routes and models
from models.database import init_db, get_db
from routes.sensor_routes import sensor_bp
from routes.analytics_routes import analytics_bp
from routes.control_routes import control_bp
from routes.auth_routes import auth_bp

# Register blueprints
app.register_blueprint(sensor_bp, url_prefix='/api')
app.register_blueprint(analytics_bp, url_prefix='/api')
app.register_blueprint(control_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api/auth')

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
    
    return jsonify({
        "status": "healthy",
        "database": db_status,
        "timestamp": datetime.now().isoformat()
    })

@app.teardown_appcontext
def close_db(error):
    """Close database connection"""
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

if __name__ == '__main__':
    # Initialize database
    init_db()
    
    # Use environment PORT for deployment
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('FLASK_ENV') != 'production'
    
    app.run(host='0.0.0.0', port=port, debug=debug)