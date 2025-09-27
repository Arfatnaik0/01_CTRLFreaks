"""
Authentication routes for IoT Control Center
"""

from flask import Blueprint, request, jsonify, session
from flask_login import login_user, logout_user, login_required, current_user
import logging

from models.auth import User

auth_bp = Blueprint('auth', __name__)
logger = logging.getLogger(__name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({
                'success': False,
                'message': 'Username and password are required'
            }), 400
        
        username = data['username']
        password = data['password']
        
        # Find user
        user = User.find_by_username(username)
        if not user or not user.check_password(password):
            return jsonify({
                'success': False,
                'message': 'Invalid username or password'
            }), 401
        
        # Log in user
        login_user(user, remember=True)
        
        # Update last login
        from models.database import get_db
        db = get_db()
        cursor = db.cursor()
        cursor.execute('''
            UPDATE users SET last_login = datetime('now') WHERE id = ?
        ''', (user.id,))
        db.commit()
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': user.to_dict()
        })
        
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({
            'success': False,
            'message': 'Login failed'
        }), 500

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    """User logout endpoint"""
    try:
        logout_user()
        return jsonify({
            'success': True,
            'message': 'Logout successful'
        })
    except Exception as e:
        logger.error(f"Logout error: {e}")
        return jsonify({
            'success': False,
            'message': 'Logout failed'
        }), 500

@auth_bp.route('/register', methods=['POST'])
def register():
    """User registration endpoint"""
    try:
        data = request.get_json()
        
        if not all(k in data for k in ('username', 'email', 'password')):
            return jsonify({
                'success': False,
                'message': 'Username, email, and password are required'
            }), 400
        
        username = data['username']
        email = data['email']
        password = data['password']
        role = data.get('role', 'operator')
        
        # Check if user already exists
        if User.find_by_username(username):
            return jsonify({
                'success': False,
                'message': 'Username already exists'
            }), 409
        
        # Create new user
        user = User.create_user(username, email, password, role)
        
        # Log in the new user
        login_user(user, remember=True)
        
        return jsonify({
            'success': True,
            'message': 'Registration successful',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        logger.error(f"Registration error: {e}")
        return jsonify({
            'success': False,
            'message': 'Registration failed'
        }), 500

@auth_bp.route('/me', methods=['GET'])
@login_required
def get_current_user():
    """Get current user information"""
    try:
        return jsonify({
            'success': True,
            'user': current_user.to_dict()
        })
    except Exception as e:
        logger.error(f"Get current user error: {e}")
        return jsonify({
            'success': False,
            'message': 'Failed to get user information'
        }), 500

@auth_bp.route('/check', methods=['GET'])
def check_auth():
    """Check authentication status"""
    if current_user.is_authenticated:
        return jsonify({
            'authenticated': True,
            'user': current_user.to_dict()
        })
    else:
        return jsonify({
            'authenticated': False
        })