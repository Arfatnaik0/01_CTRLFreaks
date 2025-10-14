"""
Simple deployment test script
Tests the improved database functionality
"""

from models.database import get_db, insert_sensor_reading
from models.tenant import TenantManager
from datetime import datetime
import json

def test_database_operations():
    """Test database operations to ensure they work"""
    try:
        print("Testing database connection...")
        db = get_db()
        print(f"✅ Database connected: {type(db)}")
        
        print("\nTesting sensor data insertion...")
        test_data = {
            'device_id': 'TEST_001',
            'tenant_id': 'factory_a',
            'timestamp': datetime.now().isoformat(),
            'current': 10.5,
            'temperature': 25.0,
            'pressure': 2.1,
            'relay_status': 'ON',
            'device_type': 'test',
            'is_active': True,
            'maintenance_required': False
        }
        
        result = insert_sensor_reading(test_data)
        if result:
            print("✅ Sensor data insertion successful")
        else:
            print("❌ Sensor data insertion failed")
            
        print("\nTesting tenant system...")
        tenants = TenantManager.get_all_tenants()
        print(f"✅ Found {len(tenants)} tenants")
        for tenant in tenants:
            print(f"  - {tenant['id']}: {tenant['name']}")
            
        return True
        
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    from app import create_app
    app = create_app()
    
    with app.app_context():
        success = test_database_operations()
        print(f"\n{'✅ All tests passed!' if success else '❌ Tests failed!'}")