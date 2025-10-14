#!/usr/bin/env python3
"""
Quick data population script - sends test data to populate dashboard
"""

import requests
import json
from datetime import datetime
import time
import random

def send_test_data():
    """Send test sensor data to populate the dashboard"""
    backend_url = "https://iot-dashboard-09py.onrender.com"
    
    devices = ["IOT_001", "IOT_002", "IOT_003", "IOT_004", "IOT_005"]
    device_types = ["pump", "motor", "heater", "compressor", "conveyor"]
    
    print("Sending test data to populate dashboard...")
    
    for i in range(10):  # Send 10 rounds of data
        for j, device_id in enumerate(devices):
            # Generate realistic sensor data
            current = round(random.uniform(8.0, 25.0), 2)
            temperature = round(random.uniform(20.0, 45.0), 2)
            pressure = round(random.uniform(1.5, 4.0), 2)
            
            data = {
                "device_id": device_id,
                "tenant_id": "factory_a",
                "timestamp": datetime.now().isoformat(),
                "current": current,
                "temperature": temperature,
                "pressure": pressure,
                "relay_status": "ON",
                "device_type": device_types[j],
                "is_active": True,
                "maintenance_required": random.choice([False, False, False, True])  # 25% chance
            }
            
            try:
                response = requests.post(
                    f"{backend_url}/api/sensor-data",
                    json=data,
                    timeout=10
                )
                
                if response.status_code == 200:
                    print(f"✅ Data sent for {device_id}: {current}A, {temperature}°C, {pressure}bar")
                else:
                    print(f"❌ Failed to send data for {device_id}: {response.status_code}")
                    
            except Exception as e:
                print(f"❌ Error sending data for {device_id}: {e}")
        
        print(f"Completed round {i+1}/10")
        time.sleep(2)  # Wait 2 seconds between rounds
    
    print("✅ Test data population completed!")
    print("🔄 Refresh your dashboard to see the data")

if __name__ == "__main__":
    send_test_data()