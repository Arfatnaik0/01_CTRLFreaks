#!/usr/bin/env python3
"""
IoT Device Simulator
Simulates hundreds of IoT devices in a manufacturing plant
Each device generates sensor readings for current, temperature, and pressure
"""

import random
import time
import json
import requests
import threading
from datetime import datetime
from typing import Dict, List
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class IoTDevice:
    """Represents a single IoT device with sensors and relay control"""
    
    def __init__(self, device_id: str, device_type: str = "generic"):
        self.device_id = device_id
        self.device_type = device_type
        self.is_active = True
        self.relay_status = "ON"
        
        # Device characteristics - vary by type
        self.base_current = random.uniform(5.0, 25.0)  # Amps
        self.base_temperature = random.uniform(20.0, 35.0)  # Celsius
        self.base_pressure = random.uniform(1.0, 5.0)  # bar
        
        # Operational parameters
        self.current_drift = random.uniform(-0.5, 0.5)
        self.temp_drift = random.uniform(-0.2, 0.2)
        self.pressure_drift = random.uniform(-0.1, 0.1)
        
        # Failure simulation parameters
        self.failure_probability = 0.001  # 0.1% chance per reading
        self.maintenance_required = False
        
    def generate_sensor_readings(self) -> Dict:
        """Generate realistic sensor readings with some randomness"""
        
        if not self.is_active or self.relay_status == "OFF":
            return {
                "device_id": self.device_id,
                "timestamp": datetime.now().isoformat(),
                "current": 0.0,
                "temperature": random.uniform(18.0, 22.0),  # Ambient temperature
                "pressure": random.uniform(0.9, 1.1),  # Atmospheric pressure
                "relay_status": self.relay_status,
                "device_type": self.device_type,
                "is_active": self.is_active,
                "maintenance_required": self.maintenance_required
            }
        
        # Simulate realistic variations
        current_noise = random.uniform(-2.0, 2.0)
        temp_noise = random.uniform(-3.0, 3.0)
        pressure_noise = random.uniform(-0.3, 0.3)
        
        # Apply drift over time
        self.base_current += self.current_drift * 0.01
        self.base_temperature += self.temp_drift * 0.01
        self.base_pressure += self.pressure_drift * 0.01
        
        # Keep values within realistic bounds
        self.base_current = max(0, min(50, self.base_current))
        self.base_temperature = max(15, min(80, self.base_temperature))
        self.base_pressure = max(0.5, min(10, self.base_pressure))
        
        current = max(0, self.base_current + current_noise)
        temperature = self.base_temperature + temp_noise
        pressure = max(0, self.base_pressure + pressure_noise)
        
        # Simulate occasional equipment stress/failure
        if random.random() < self.failure_probability:
            if random.choice([True, False]):
                # Overheat scenario
                temperature += random.uniform(15, 30)
                current += random.uniform(5, 15)
            else:
                # Pressure spike scenario
                pressure += random.uniform(2, 5)
                current += random.uniform(3, 8)
            
            self.maintenance_required = True
        
        return {
            "device_id": self.device_id,
            "timestamp": datetime.now().isoformat(),
            "current": round(current, 2),
            "temperature": round(temperature, 2),
            "pressure": round(pressure, 2),
            "relay_status": self.relay_status,
            "device_type": self.device_type,
            "is_active": self.is_active,
            "maintenance_required": self.maintenance_required
        }
    
    def toggle_relay(self, status: str):
        """Control relay (turn device ON/OFF)"""
        if status.upper() in ["ON", "OFF"]:
            self.relay_status = status.upper()
            logger.info(f"Device {self.device_id} relay set to {self.relay_status}")
        
    def set_maintenance_status(self, required: bool):
        """Set maintenance status"""
        self.maintenance_required = required


class DeviceFleet:
    """Manages a fleet of IoT devices and handles communication with backend"""
    
    def __init__(self, num_devices: int = 100, backend_url: str = "http://127.0.0.1:5001"):
        self.backend_url = backend_url
        self.devices: List[IoTDevice] = []
        self.running = False
        self.send_interval = 5  # seconds between readings
        
        # Create device fleet with different types
        device_types = ["pump", "motor", "heater", "compressor", "conveyor", "sensor_unit"]
        
        for i in range(num_devices):
            device_id = f"IOT_{i+1:03d}"
            device_type = random.choice(device_types)
            self.devices.append(IoTDevice(device_id, device_type))
        
        logger.info(f"Initialized fleet of {num_devices} devices")
    
    def send_sensor_data(self, device: IoTDevice):
        """Send sensor data to backend API"""
        try:
            readings = device.generate_sensor_readings()
            response = requests.post(
                f"{self.backend_url}/api/sensor-data",
                json=readings,
                timeout=5
            )
            
            if response.status_code == 200:
                logger.debug(f"Data sent successfully for device {device.device_id}")
            else:
                logger.warning(f"Failed to send data for device {device.device_id}: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error sending data for device {device.device_id}: {e}")
        except Exception as e:
            logger.error(f"Unexpected error for device {device.device_id}: {e}")
    
    def device_worker(self, device: IoTDevice):
        """Worker thread for individual device"""
        while self.running:
            if device.is_active:
                self.send_sensor_data(device)
            
            # Add some jitter to prevent thundering herd
            sleep_time = self.send_interval + random.uniform(-1, 1)
            time.sleep(max(1, sleep_time))
    
    def check_control_commands(self):
        """Check for control commands from backend"""
        try:
            response = requests.get(f"{self.backend_url}/api/control-commands", timeout=5)
            if response.status_code == 200:
                commands = response.json()
                for command in commands.get('commands', []):
                    device_id = command.get('device_id')
                    action = command.get('action')
                    
                    device = next((d for d in self.devices if d.device_id == device_id), None)
                    if device:
                        if action == 'toggle_relay':
                            status = command.get('status', 'ON')
                            device.toggle_relay(status)
                        elif action == 'set_maintenance':
                            required = command.get('required', False)
                            device.set_maintenance_status(required)
                        
                        logger.info(f"Executed command {action} for device {device_id}")
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Error checking control commands: {e}")
    
    def start_simulation(self):
        """Start the device simulation"""
        self.running = True
        logger.info("Starting IoT device simulation...")
        
        # Start worker threads for each device
        threads = []
        for device in self.devices:
            thread = threading.Thread(target=self.device_worker, args=(device,))
            thread.daemon = True
            thread.start()
            threads.append(thread)
        
        # Control command checker thread
        control_thread = threading.Thread(target=self.control_command_worker)
        control_thread.daemon = True
        control_thread.start()
        
        return threads
    
    def control_command_worker(self):
        """Worker thread for checking control commands"""
        while self.running:
            self.check_control_commands()
            time.sleep(10)  # Check every 10 seconds
    
    def stop_simulation(self):
        """Stop the device simulation"""
        self.running = False
        logger.info("Stopping IoT device simulation...")
    
    def get_device_status(self):
        """Get status of all devices"""
        return {
            "total_devices": len(self.devices),
            "active_devices": sum(1 for d in self.devices if d.is_active),
            "devices_on": sum(1 for d in self.devices if d.relay_status == "ON"),
            "devices_needing_maintenance": sum(1 for d in self.devices if d.maintenance_required),
            "device_types": {}
        }


def main():
    """Main function to run the simulator"""
    import argparse
    
    parser = argparse.ArgumentParser(description="IoT Device Simulator")
    parser.add_argument("--devices", type=int, default=100, help="Number of devices to simulate")
    parser.add_argument("--backend", default="http://127.0.0.1:5001", help="Backend URL")
    parser.add_argument("--interval", type=int, default=5, help="Data send interval in seconds")
    
    args = parser.parse_args()
    
    # Create device fleet
    fleet = DeviceFleet(num_devices=args.devices, backend_url=args.backend)
    fleet.send_interval = args.interval
    
    try:
        # Start simulation
        threads = fleet.start_simulation()
        
        logger.info(f"Simulation started with {args.devices} devices")
        logger.info(f"Sending data every {args.interval} seconds to {args.backend}")
        logger.info("Press Ctrl+C to stop...")
        
        # Keep main thread alive
        while True:
            time.sleep(60)
            status = fleet.get_device_status()
            logger.info(f"Fleet status: {status['active_devices']}/{status['total_devices']} active, "
                       f"{status['devices_on']} ON, {status['devices_needing_maintenance']} need maintenance")
    
    except KeyboardInterrupt:
        logger.info("Simulation interrupted by user")
    except Exception as e:
        logger.error(f"Simulation error: {e}")
    finally:
        fleet.stop_simulation()
        logger.info("Simulation stopped")


if __name__ == "__main__":
    main()