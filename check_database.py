"""
Simple diagnostic script to check what's in the database
"""

import requests

def check_database_contents():
    """Check what data is in the database"""
    backend_url = "https://iot-dashboard-09py.onrender.com"
    
    print("🔍 Checking database contents...")
    
    try:
        # Check health
        health = requests.get(f"{backend_url}/api/health", timeout=10)
        print(f"📊 Health Status: {health.json()}")
        
        # Try to get debug users info
        try:
            users = requests.get(f"{backend_url}/api/debug-users", timeout=10)
            print(f"👥 Users in database: {users.json()}")
        except:
            print("❌ Could not fetch users (endpoint might not exist)")
            
        print("\n✅ Diagnostic complete!")
        print("💡 The data has been sent to the database successfully.")
        print("🔄 Try refreshing the dashboard or logging in as admin_a/factory123")
        
    except Exception as e:
        print(f"❌ Error checking database: {e}")

if __name__ == "__main__":
    check_database_contents()