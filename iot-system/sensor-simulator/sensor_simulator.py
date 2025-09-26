import json
import time
import random
import numpy as np
from datetime import datetime, timedelta
from kafka import KafkaProducer
import os
import threading
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class IoTDeviceSimulator:
    def __init__(self, device_config):
        self.device_id = device_config['device_id']
        self.device_type = device_config['device_type']
        self.location = device_config['location']
        self.manufacturer = device_config['manufacturer']
        self.model = device_config['model']
        self.max_current = device_config['max_current']
        self.max_temperature = device_config['max_temperature']
        self.max_pressure = device_config['max_pressure']
        
        # Operational state
        self.is_active = True
        self.failure_probability = 0.001  # 0.1% chance of failure per reading
        self.maintenance_mode = False
        
        # Historical patterns (for realistic simulation)
        self.base_current = self.max_current * 0.6
        self.base_temperature = self.max_temperature * 0.7
        self.base_pressure = self.max_pressure * 0.8
        
        # Pattern variations based on device type
        self._setup_device_patterns()
    
    def _setup_device_patterns(self):
        """Setup realistic patterns based on device type"""
        patterns = {
            'motor': {
                'current_variation': 0.3,
                'temp_variation': 0.2,
                'pressure_variation': 0.1,
                'peak_hours': [8, 9, 10, 14, 15, 16]  # Work hours
            },
            'hvac': {
                'current_variation': 0.4,
                'temp_variation': 0.15,
                'pressure_variation': 0.05,
                'peak_hours': [11, 12, 13, 14, 15]  # Midday cooling
            },
            'lighting': {
                'current_variation': 0.1,
                'temp_variation': 0.1,
                'pressure_variation': 0.0,
                'peak_hours': [6, 7, 18, 19, 20]  # Morning/evening
            },
            'pump': {
                'current_variation': 0.25,
                'temp_variation': 0.2,
                'pressure_variation': 0.3,
                'peak_hours': [8, 9, 16, 17]  # Process times
            },
            'compressor': {
                'current_variation': 0.35,
                'temp_variation': 0.25,
                'pressure_variation': 0.4,
                'peak_hours': [9, 10, 11, 14, 15]  # Peak production
            },
            'conveyor': {
                'current_variation': 0.2,
                'temp_variation': 0.15,
                'pressure_variation': 0.05,
                'peak_hours': [8, 9, 10, 13, 14, 15, 16]  # Production hours
            }
        }
        
        self.pattern = patterns.get(self.device_type, patterns['motor'])
    
    def generate_sensor_reading(self):
        """Generate realistic sensor reading"""
        now = datetime.utcnow()
        hour = now.hour
        
        # Time-based multiplier (higher during peak hours)
        time_multiplier = 1.0
        if hour in self.pattern['peak_hours']:
            time_multiplier = 1.2 + random.uniform(0, 0.3)
        elif hour < 6 or hour > 22:  # Night hours
            time_multiplier = 0.4 + random.uniform(0, 0.2)
        
        # Base values with time variation
        current = self.base_current * time_multiplier
        temperature = self.base_temperature * (0.8 + time_multiplier * 0.4)
        pressure = self.base_pressure * time_multiplier
        
        # Add random variations
        current += random.uniform(
            -current * self.pattern['current_variation'],
            current * self.pattern['current_variation']
        )
        
        temperature += random.uniform(
            -temperature * self.pattern['temp_variation'],
            temperature * self.pattern['temp_variation']
        )
        
        pressure += random.uniform(
            -pressure * self.pattern['pressure_variation'],
            pressure * self.pattern['pressure_variation']
        )
        
        # Ensure values don't go below 0 or above max
        current = max(0, min(current, self.max_current * 1.1))
        temperature = max(0, min(temperature, self.max_temperature * 1.1))
        pressure = max(0, min(pressure, self.max_pressure * 1.1))
        
        # Calculate energy consumption (simplified: P = V * I, assuming 240V)
        voltage = 240  # Standard industrial voltage
        energy_consumption = (voltage * current) / 1000  # kW
        
        # Determine status based on thresholds
        status = self._determine_status(current, temperature, pressure)
        
        return {
            'device_id': self.device_id,
            'timestamp': now.isoformat(),
            'current_value': round(current, 2),
            'temperature': round(temperature, 2),
            'pressure': round(pressure, 2),
            'energy_consumption': round(energy_consumption, 3),
            'status': status,
            'device_type': self.device_type,
            'location': self.location
        }
    
    def _determine_status(self, current, temperature, pressure):
        """Determine device status based on sensor values"""
        # Check for critical conditions
        if (current > self.max_current * 0.95 or 
            temperature > self.max_temperature * 0.9 or 
            pressure > self.max_pressure * 0.9):
            return 'critical'
        
        # Check for warning conditions
        if (current > self.max_current * 0.8 or 
            temperature > self.max_temperature * 0.8 or 
            pressure > self.max_pressure * 0.8):
            return 'warning'
        
        # Random failure simulation
        if random.random() < self.failure_probability:
            return 'error'
        
        return 'normal'

class SensorDataProducer:
    def __init__(self, kafka_servers='localhost:9092'):
        self.kafka_servers = kafka_servers
        self.producer = None
        self.devices = []
        self.running = False
        
        self._setup_kafka_producer()
        self._setup_devices()
    
    def _setup_kafka_producer(self):
        """Initialize Kafka producer"""
        try:
            self.producer = KafkaProducer(
                bootstrap_servers=self.kafka_servers,
                value_serializer=lambda x: json.dumps(x).encode('utf-8'),
                key_serializer=lambda x: x.encode('utf-8') if x else None
            )
            logger.info(f"Kafka producer connected to {self.kafka_servers}")
        except Exception as e:
            logger.error(f"Failed to connect to Kafka: {e}")
            raise
    
    def _setup_devices(self):
        """Setup simulated IoT devices"""
        device_configs = [
            # Motors
            {'device_id': 'MOTOR_001', 'device_type': 'motor', 'location': 'Production Line 1', 
             'manufacturer': 'Siemens', 'model': 'Motor-X1', 'max_current': 15.0, 'max_temperature': 80.0, 'max_pressure': 10.0},
            {'device_id': 'MOTOR_002', 'device_type': 'motor', 'location': 'Production Line 2', 
             'manufacturer': 'ABB', 'model': 'Motor-Y2', 'max_current': 20.0, 'max_temperature': 85.0, 'max_pressure': 12.0},
            {'device_id': 'MOTOR_003', 'device_type': 'motor', 'location': 'Assembly Line A', 
             'manufacturer': 'Siemens', 'model': 'Motor-X2', 'max_current': 18.0, 'max_temperature': 82.0, 'max_pressure': 11.0},
            
            # HVAC Systems
            {'device_id': 'HVAC_001', 'device_type': 'hvac', 'location': 'Zone A', 
             'manufacturer': 'Carrier', 'model': 'HVAC-Z1', 'max_current': 25.0, 'max_temperature': 40.0, 'max_pressure': 5.0},
            {'device_id': 'HVAC_002', 'device_type': 'hvac', 'location': 'Zone B', 
             'manufacturer': 'Trane', 'model': 'HVAC-Z2', 'max_current': 30.0, 'max_temperature': 45.0, 'max_pressure': 6.0},
            
            # Lighting Systems
            {'device_id': 'LIGHT_001', 'device_type': 'lighting', 'location': 'Warehouse 1', 
             'manufacturer': 'Philips', 'model': 'LED-Array-1', 'max_current': 5.0, 'max_temperature': 35.0, 'max_pressure': 0.0},
            {'device_id': 'LIGHT_002', 'device_type': 'lighting', 'location': 'Warehouse 2', 
             'manufacturer': 'GE', 'model': 'LED-Array-2', 'max_current': 7.0, 'max_temperature': 40.0, 'max_pressure': 0.0},
            
            # Pumps
            {'device_id': 'PUMP_001', 'device_type': 'pump', 'location': 'Water System', 
             'manufacturer': 'Grundfos', 'model': 'Pump-A1', 'max_current': 12.0, 'max_temperature': 60.0, 'max_pressure': 15.0},
            {'device_id': 'PUMP_002', 'device_type': 'pump', 'location': 'Cooling System', 
             'manufacturer': 'Flygt', 'model': 'Pump-B2', 'max_current': 18.0, 'max_temperature': 65.0, 'max_pressure': 20.0},
            
            # Compressors
            {'device_id': 'COMPRESSOR_001', 'device_type': 'compressor', 'location': 'Air System', 
             'manufacturer': 'Atlas Copco', 'model': 'Comp-C1', 'max_current': 35.0, 'max_temperature': 90.0, 'max_pressure': 25.0},
            
            # Conveyors
            {'device_id': 'CONVEYOR_001', 'device_type': 'conveyor', 'location': 'Assembly Line', 
             'manufacturer': 'Dematic', 'model': 'Conv-D1', 'max_current': 8.0, 'max_temperature': 50.0, 'max_pressure': 2.0},
            {'device_id': 'CONVEYOR_002', 'device_type': 'conveyor', 'location': 'Packaging Line', 
             'manufacturer': 'Siemens', 'model': 'Conv-D2', 'max_current': 10.0, 'max_temperature': 55.0, 'max_pressure': 3.0}
        ]
        
        # Create device simulators
        for config in device_configs:
            device = IoTDeviceSimulator(config)
            self.devices.append(device)
        
        logger.info(f"Initialized {len(self.devices)} IoT device simulators")
    
    def start_simulation(self, interval=5):
        """Start generating sensor data"""
        self.running = True
        logger.info("Starting IoT sensor data simulation...")
        
        def send_data():
            while self.running:
                for device in self.devices:
                    if device.is_active and not device.maintenance_mode:
                        try:
                            # Generate sensor reading
                            sensor_data = device.generate_sensor_reading()
                            
                            # Send to Kafka
                            self.producer.send(
                                topic='sensor-data',
                                key=device.device_id,
                                value=sensor_data
                            )
                            
                        except Exception as e:
                            logger.error(f"Error sending data for {device.device_id}: {e}")
                
                # Flush producer to ensure messages are sent
                try:
                    self.producer.flush()
                except Exception as e:
                    logger.error(f"Error flushing Kafka producer: {e}")
                
                time.sleep(interval)
        
        # Start data generation in separate thread
        thread = threading.Thread(target=send_data)
        thread.daemon = True
        thread.start()
        
        return thread
    
    def stop_simulation(self):
        """Stop the simulation"""
        self.running = False
        if self.producer:
            self.producer.close()
        logger.info("Sensor simulation stopped")

def main():
    # Get Kafka configuration from environment
    kafka_servers = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
    
    # Initialize and start simulator
    producer = SensorDataProducer(kafka_servers)
    
    try:
        # Start simulation
        thread = producer.start_simulation(interval=2)  # Send data every 2 seconds
        
        # Keep the main thread alive
        while True:
            time.sleep(10)
            logger.info(f"Simulation running... Active devices: {len(producer.devices)}")
            
    except KeyboardInterrupt:
        logger.info("Shutting down sensor simulator...")
        producer.stop_simulation()
    except Exception as e:
        logger.error(f"Simulator error: {e}")
        producer.stop_simulation()

if __name__ == '__main__':
    main()