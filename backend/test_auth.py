#!/usr/bin/env python3
"""
Test authentication system with tenant support
"""

from app import create_app
from models.auth import User

def test_auth_system():
    """Test the updated authentication system"""
    try:
        app = create_app()
        
        with app.app_context():
            # Test finding admin_a user
            user = User.find_by_username('admin_a')
            if user:
                print("✅ Found user:", user.username)
                print("✅ Role:", user.role)
                print("✅ Tenant ID:", user.tenant_id)
                print("✅ User dict:", user.to_dict())
            else:
                print("❌ User admin_a not found")
                
            # Test legacy admin user
            legacy_user = User.find_by_username('admin')
            if legacy_user:
                print("\n✅ Found legacy user:", legacy_user.username)
                print("✅ Legacy role:", legacy_user.role)
                print("✅ Legacy tenant ID:", legacy_user.tenant_id)
            else:
                print("❌ Legacy admin user not found")
                
    except Exception as e:
        print(f"❌ Error testing auth system: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_auth_system()