"""
Authentication models for IoT Control Center
"""

import bcrypt
from flask_login import UserMixin
from .database import get_db
import logging

logger = logging.getLogger(__name__)

class User(UserMixin):
    def __init__(self, id, username, email, password_hash, role='operator', tenant_id='factory_a'):
        self.id = id
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self.role = role
        self.tenant_id = tenant_id
    
    @staticmethod
    def create_user(username, email, password, role='operator'):
        """Create a new user with hashed password"""
        try:
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
            
            db = get_db()
            cursor = db.cursor()
            
            cursor.execute('''
                INSERT INTO users (username, email, password_hash, role, created_at)
                VALUES (?, ?, ?, ?, datetime('now'))
            ''', (username, email, password_hash, role))
            
            user_id = cursor.lastrowid
            db.commit()
            
            return User(user_id, username, email, password_hash, role)
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise
    
    @staticmethod
    def find_by_username(username):
        """Find user by username"""
        try:
            db = get_db()
            cursor = db.cursor()
            
            cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
            user_data = cursor.fetchone()
            
            if user_data:
                return User(
                    user_data['id'], 
                    user_data['username'], 
                    user_data['email'],
                    user_data['password_hash'],
                    user_data['role'],
                    user_data['tenant_id'] if 'tenant_id' in user_data.keys() else 'factory_a'
                )
            return None
        except Exception as e:
            logger.error(f"Error finding user: {e}")
            return None
    
    @staticmethod
    def find_by_id(user_id):
        """Find user by ID"""
        try:
            db = get_db()
            cursor = db.cursor()
            
            cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
            user_data = cursor.fetchone()
            
            if user_data:
                return User(
                    user_data['id'], 
                    user_data['username'], 
                    user_data['email'],
                    user_data['password_hash'],
                    user_data['role'],
                    user_data['tenant_id'] if 'tenant_id' in user_data.keys() else 'factory_a'
                )
            return None
        except Exception as e:
            logger.error(f"Error finding user by ID: {e}")
            return None
    
    def check_password(self, password):
        """Check if provided password matches the hash"""
        try:
            return bcrypt.checkpw(password.encode('utf-8'), self.password_hash)
        except Exception as e:
            logger.error(f"Error checking password: {e}")
            return False
    
    def get_id(self):
        """Required by Flask-Login"""
        return str(self.id)
    
    def to_dict(self):
        """Convert user to dictionary for JSON responses"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'tenant_id': self.tenant_id
        }