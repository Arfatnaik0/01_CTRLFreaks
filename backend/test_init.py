#!/usr/bin/env python3
"""
Test script to initialize the database and tenant system
"""

from app import create_app
from models.database import init_db
from models.tenant import TenantManager

def test_initialization():
    """Test database and tenant system initialization"""
    try:
        # Create Flask app
        app = create_app()
        
        with app.app_context():
            # Initialize database
            print("Initializing database...")
            init_db()
            print("Database initialized successfully!")
            
            # Initialize tenant system
            print("Initializing tenant system...")
            success = TenantManager.create_tenant_system()
            if success:
                print("Tenant system initialized successfully!")
                
                # Get all tenants
                tenants = TenantManager.get_all_tenants()
                print(f"Created {len(tenants)} tenants:")
                for tenant in tenants:
                    print(f"  - {tenant['id']}: {tenant['name']}")
            else:
                print("Tenant system initialization failed!")
                
    except Exception as e:
        print(f"Error during initialization: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_initialization()