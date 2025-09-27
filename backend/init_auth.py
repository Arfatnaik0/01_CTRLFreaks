"""
Database initialization script with default users
"""

from app import app
from models.database import init_db
from models.auth import User
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_auth_db():
    """Initialize database and create default users"""
    with app.app_context():
        try:
            # Initialize database tables
            init_db()
            logger.info("Database initialized successfully")
            
            # Create default admin user
            try:
                admin_user = User.create_user('admin', 'admin@iot.local', 'admin123', 'admin')
                logger.info(f"Created default admin user: {admin_user.username}")
            except Exception as e:
                logger.info(f"Admin user may already exist: {e}")
            
            # Create default operator user
            try:
                operator_user = User.create_user('operator', 'operator@iot.local', 'operator123', 'operator')
                logger.info(f"Created default operator user: {operator_user.username}")
            except Exception as e:
                logger.info(f"Operator user may already exist: {e}")
                
            logger.info("Database initialization completed")
            
        except Exception as e:
            logger.error(f"Database initialization failed: {e}")

if __name__ == "__main__":
    init_auth_db()