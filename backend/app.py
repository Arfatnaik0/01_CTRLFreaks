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
    
    # Configuration
    app.config['DATABASE'] = 'iot_data.db'
    app.config['SECRET_KEY'] = secrets.token_hex(16)  # Generate secure secret key
    
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
    
    # Run the application
    app.run(host='127.0.0.1', port=5001, debug=True)