"""
Vercel-compatible Flask application entry point
"""
import sys
import os

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from app import create_app
from models.database import init_db

# Initialize the database
try:
    init_db()
except Exception as e:
    print(f"Database initialization error: {e}")

# Create the Flask app
app = create_app()

# Vercel expects this export
application = app

if __name__ == "__main__":
    app.run()