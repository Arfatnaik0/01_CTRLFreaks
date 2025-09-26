import json
import time
import random
import numpy as np
from datetime import datetime, timedelta
from kafka import KafkaProducer
import os
import threading
import logging
import math

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
        
        # Enhanced operational state
        self.is_active = True
        self.failure_probability = 0.001  # 0.1% chance of failure per reading
        self.maintenance_mode = False
        self.degradation_factor = 1.0  # Device efficiency degradation over time
        self.last_maintenance = datetime.utcnow() - timedelta(days=random.randint(1, 30))
        
        # Enhanced patterns for realistic simulation
        self.base_current = self.max_current * random.uniform(0.5, 0.7)
        self.base_temperature = self.max_temperature * random.uniform(0.6, 0.8)
        self.base_pressure = self.max_pressure * random.uniform(0.7, 0.9)
        
        # Seasonal and weather factors
        self.seasonal_factor = 1.0
        self.weather_factor = 1.0
        
        # Device-specific wear patterns
        self.operating_hours = random.randint(1000, 8760)  # Hours since last maintenance
        self.cycles_completed = random.randint(10000, 100000)
        
        # Pattern variations based on device type
        self._setup_device_patterns()
        
        # Initialize anomaly tracking
        self.anomaly_state = 'normal'
        self.anomaly_duration = 0
        self.consecutive_high_readings = 0
    
    def _setup_device_patterns(self):
        """Setup realistic patterns based on device type"""
        patterns = {
            'motor': {
                'current_variation': 0.3,
                'temp_variation': 0.25,
                'pressure_variation': 0.15,
                'peak_hours': [7, 8, 9, 10, 14, 15, 16, 17],  # Work hours
                'failure_modes': ['overheating', 'overcurrent', 'vibration'],
                'degradation_rate': 0.002,  # 0.2% per 100 hours
                'seasonal_sensitivity': 0.15
            },
            'hvac': {
                'current_variation': 0.4,
                'temp_variation': 0.1,
                'pressure_variation': 0.05,
                'peak_hours': [10, 11, 12, 13, 14, 15, 16],  # Cooling hours
                'failure_modes': ['refrigerant_leak', 'compressor_failure', 'filter_clog'],
                'degradation_rate': 0.001,
                'seasonal_sensitivity': 0.4  # Very weather dependent
            },
            'lighting': {
                'current_variation': 0.1,
                'temp_variation': 0.08,
                'pressure_variation': 0.0,
                'peak_hours': [6, 7, 18, 19, 20, 21],  # Morning/evening
                'failure_modes': ['led_degradation', 'driver_failure', 'overheating'],
                'degradation_rate': 0.0005,
                'seasonal_sensitivity': 0.05
            },
            'pump': {
                'current_variation': 0.25,
                'temp_variation': 0.2,
                'pressure_variation': 0.35,
                'peak_hours': [6, 7, 8, 16, 17, 18],  # Process times
                'failure_modes': ['cavitation', 'seal_failure', 'impeller_wear'],
                'degradation_rate': 0.003,
                'seasonal_sensitivity': 0.1
            },
            'compressor': {
                'current_variation': 0.35,
                'temp_variation': 0.3,
                'pressure_variation': 0.4,
                'peak_hours': [8, 9, 10, 11, 13, 14, 15, 16],  # Peak production
                'failure_modes': ['overheating', 'pressure_buildup', 'valve_failure'],
                'degradation_rate': 0.004,
                'seasonal_sensitivity': 0.2
            },
            'conveyor': {
                'current_variation': 0.2,
                'temp_variation': 0.15,
                'pressure_variation': 0.1,
                'peak_hours': [8, 9, 10, 13, 14, 15, 16],  # Production hours
                'failure_modes': ['belt_wear', 'motor_strain', 'bearing_failure'],
                'degradation_rate': 0.0015,
                'seasonal_sensitivity': 0.05
            }
        }
        
        self.pattern = patterns.get(self.device_type, patterns['motor'])
    
    def _calculate_seasonal_factor(self):
        """Calculate seasonal impact on device performance"""
        now = datetime.utcnow()
        day_of_year = now.timetuple().tm_yday
        
        # Sinusoidal variation throughout the year
        seasonal_base = 1 + 0.3 * math.sin(2 * math.pi * day_of_year / 365.25 + math.pi/2)
        
        # Apply device sensitivity
        seasonal_impact = 1 + (seasonal_base - 1) * self.pattern['seasonal_sensitivity']
        
        return seasonal_impact
    
    def _calculate_degradation(self):
        """Calculate device degradation based on operating time"""
        hours_since_maintenance = (datetime.utcnow() - self.last_maintenance).total_seconds() / 3600
        degradation = 1 + (hours_since_maintenance * self.pattern['degradation_rate'])
        
        # Cap degradation to reasonable limits
        return min(degradation, 1.5)
    
    def _generate_anomaly(self):
        """Generate realistic anomalies and failure patterns"""
        # Check if we should start a new anomaly
        if self.anomaly_state == 'normal' and random.random() < 0.005:  # 0.5% chance
            anomaly_types = ['spike', 'drift', 'oscillation', 'degradation']
            self.anomaly_state = random.choice(anomaly_types)
            self.anomaly_duration = random.randint(5, 30)  # 5-30 readings
            logger.info(f"Device {self.device_id}: Starting {self.anomaly_state} anomaly")
        
        # Apply current anomaly
        current_multiplier = temp_multiplier = pressure_multiplier = 1.0
        
        if self.anomaly_state != 'normal':
            self.anomaly_duration -= 1
            
            if self.anomaly_state == 'spike':
                # Sudden spike in readings
                spike_factor = random.uniform(1.3, 1.8)
                current_multiplier = spike_factor
                temp_multiplier = spike_factor * 0.7
                pressure_multiplier = spike_factor * 0.5
                
            elif self.anomaly_state == 'drift':
                # Gradual increase over time
                drift_factor = 1 + (30 - self.anomaly_duration) * 0.02
                current_multiplier = drift_factor
                temp_multiplier = drift_factor * 0.8
                
            elif self.anomaly_state == 'oscillation':
                # Oscillating values
                osc_factor = 1 + 0.3 * math.sin(self.anomaly_duration * 0.5)
                current_multiplier = osc_factor
                temp_multiplier = osc_factor
                
            elif self.anomaly_state == 'degradation':
                # Performance degradation
                deg_factor = 1 + (30 - self.anomaly_duration) * 0.015
                current_multiplier = deg_factor
                temp_multiplier = deg_factor * 1.2
                pressure_multiplier = 1 / deg_factor  # Pressure drops with degradation
            
            # End anomaly
            if self.anomaly_duration <= 0:
                logger.info(f"Device {self.device_id}: Ending {self.anomaly_state} anomaly")
                self.anomaly_state = 'normal'
        
        return current_multiplier, temp_multiplier, pressure_multiplier
    
    def generate_sensor_reading(self):
        """Generate enhanced realistic sensor reading"""
        now = datetime.utcnow()
        hour = now.hour
        minute = now.minute
        
        # Time-based multiplier (higher during peak hours)
        time_multiplier = 1.0
        if hour in self.pattern['peak_hours']:
            time_multiplier = 1.1 + random.uniform(0, 0.4)
        elif hour < 6 or hour > 22:  # Night hours
            time_multiplier = 0.3 + random.uniform(0, 0.3)
        
        # Add minute-level variations for more realistic patterns
        minute_variation = 1 + 0.1 * math.sin(minute * math.pi / 30)
        time_multiplier *= minute_variation
        
        # Calculate environmental factors
        seasonal_factor = self._calculate_seasonal_factor()
        degradation_factor = self._calculate_degradation()
        
        # Generate anomalies
        anomaly_current, anomaly_temp, anomaly_pressure = self._generate_anomaly()
        
        # Base values with all modifiers
        current = self.base_current * time_multiplier * seasonal_factor * degradation_factor * anomaly_current
        temperature = self.base_temperature * (0.7 + time_multiplier * 0.5) * seasonal_factor * degradation_factor * anomaly_temp
        pressure = self.base_pressure * time_multiplier * seasonal_factor * (2 - degradation_factor) * anomaly_pressure
        
        # Add realistic noise and variations
        current_noise = random.normalvariate(0, current * 0.02)  # 2% noise
        temp_noise = random.normalvariate(0, temperature * 0.015)  # 1.5% noise
        pressure_noise = random.normalvariate(0, pressure * 0.025)  # 2.5% noise
        
        current += current_noise
        temperature += temp_noise
        pressure += pressure_noise
        
        # Add device-specific variations
        current += random.uniform(
            -current * self.pattern['current_variation'] * 0.5,
            current * self.pattern['current_variation'] * 0.5
        )
        
        temperature += random.uniform(
            -temperature * self.pattern['temp_variation'] * 0.3,
            temperature * self.pattern['temp_variation'] * 0.3
        )
        
        pressure += random.uniform(
            -pressure * self.pattern['pressure_variation'] * 0.4,
            pressure * self.pattern['pressure_variation'] * 0.4
        )
        
        # Ensure values don't go below 0 or above realistic limits
        current = max(0, min(current, self.max_current * 1.2))
        temperature = max(0, min(temperature, self.max_temperature * 1.15))
        pressure = max(0, min(pressure, self.max_pressure * 1.1))
        
        # Calculate enhanced energy consumption
        # Using more realistic power calculation: P = V * I * cos(φ) + reactive power
        voltage = random.uniform(230, 250)  # Voltage variations
        power_factor = random.uniform(0.85, 0.95)  # Typical industrial power factor
        reactive_factor = math.sqrt(1 - power_factor**2)
        
        apparent_power = voltage * current / 1000  # kVA
        real_power = apparent_power * power_factor  # kW
        reactive_power = apparent_power * reactive_factor  # kVAR
        
        # Add efficiency losses
        efficiency = max(0.7, 1.0 - (degradation_factor - 1.0))
        energy_consumption = real_power / efficiency
        
        # Determine enhanced status based on thresholds and patterns
        status = self._determine_enhanced_status(current, temperature, pressure, energy_consumption)
        
        # Track consecutive high readings for predictive maintenance
        if (current > self.max_current * 0.8 or 
            temperature > self.max_temperature * 0.8 or 
            pressure > self.max_pressure * 0.8):
            self.consecutive_high_readings += 1
        else:
            self.consecutive_high_readings = max(0, self.consecutive_high_readings - 1)
        
        return {
            'device_id': self.device_id,
            'timestamp': now.isoformat(),
            'current_value': round(current, 3),
            'temperature': round(temperature, 2),
            'pressure': round(pressure, 2),
            'energy_consumption': round(energy_consumption, 4),
            'apparent_power': round(apparent_power, 4),
            'power_factor': round(power_factor, 3),
            'efficiency': round(efficiency, 3),
            'status': status,
            'device_type': self.device_type,
            'location': self.location,
            'seasonal_factor': round(seasonal_factor, 3),
            'degradation_factor': round(degradation_factor, 3),
            'anomaly_state': self.anomaly_state,
            'consecutive_high_readings': self.consecutive_high_readings,
            'operating_hours': self.operating_hours,
            'last_maintenance_days': (now - self.last_maintenance).days
        }
    
    def _determine_enhanced_status(self, current, temperature, pressure, energy_consumption):
        """Enhanced status determination with predictive indicators"""
        
        # Critical conditions
        if (current > self.max_current * 0.95 or 
            temperature > self.max_temperature * 0.9 or 
            pressure > self.max_pressure * 0.9):
            return 'critical'
        
        # Predictive maintenance indicators
        if (self.consecutive_high_readings > 5 or 
            (datetime.utcnow() - self.last_maintenance).days > 90):
            return 'maintenance_required'
        
        # Performance degradation
        if (energy_consumption > self.base_current * 240 * 1.3 / 1000 or  # 30% above normal
            self.degradation_factor > 1.2):
            return 'performance_degraded'
        
        # Warning conditions
        if (current > self.max_current * 0.8 or 
            temperature > self.max_temperature * 0.8 or 
            pressure > self.max_pressure * 0.8):
            return 'warning'
        
        # Anomaly detection
        if self.anomaly_state != 'normal':
            return 'anomaly_detected'
        
        # Random failure simulation (very low probability)
        if random.random() < self.failure_probability:
            failure_mode = random.choice(self.pattern['failure_modes'])
            logger.warning(f"Device {self.device_id}: Simulated failure - {failure_mode}")
            return 'error'
        
        return 'normal'

class SensorDataProducer:
    def __init__(self, kafka_servers='kafka:29092'):
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
        """Setup enhanced simulated IoT devices with more variety"""
        device_configs = [
            # Motors - Production Line Equipment
            {'device_id': 'MOTOR_001', 'device_type': 'motor', 'location': 'Production Line 1', 
             'manufacturer': 'Siemens', 'model': 'Motor-X1', 'max_current': 15.0, 'max_temperature': 80.0, 'max_pressure': 10.0},
            {'device_id': 'MOTOR_002', 'device_type': 'motor', 'location': 'Production Line 2', 
             'manufacturer': 'ABB', 'model': 'Motor-Y2', 'max_current': 20.0, 'max_temperature': 85.0, 'max_pressure': 12.0},
            {'device_id': 'MOTOR_003', 'device_type': 'motor', 'location': 'Assembly Line A', 
             'manufacturer': 'Siemens', 'model': 'Motor-X2', 'max_current': 18.0, 'max_temperature': 82.0, 'max_pressure': 11.0},
            {'device_id': 'MOTOR_004', 'device_type': 'motor', 'location': 'Packaging Line', 
             'manufacturer': 'WEG', 'model': 'Motor-W1', 'max_current': 12.0, 'max_temperature': 75.0, 'max_pressure': 8.0},
            {'device_id': 'MOTOR_005', 'device_type': 'motor', 'location': 'Quality Control', 
             'manufacturer': 'Baldor', 'model': 'Motor-B1', 'max_current': 10.0, 'max_temperature': 70.0, 'max_pressure': 6.0},
            
            # HVAC Systems - Climate Control
            {'device_id': 'HVAC_001', 'device_type': 'hvac', 'location': 'Zone A - Production', 
             'manufacturer': 'Carrier', 'model': 'HVAC-Z1', 'max_current': 25.0, 'max_temperature': 40.0, 'max_pressure': 5.0},
            {'device_id': 'HVAC_002', 'device_type': 'hvac', 'location': 'Zone B - Assembly', 
             'manufacturer': 'Trane', 'model': 'HVAC-Z2', 'max_current': 30.0, 'max_temperature': 45.0, 'max_pressure': 6.0},
            {'device_id': 'HVAC_003', 'device_type': 'hvac', 'location': 'Zone C - Warehouse', 
             'manufacturer': 'York', 'model': 'HVAC-Y1', 'max_current': 35.0, 'max_temperature': 42.0, 'max_pressure': 7.0},
            {'device_id': 'HVAC_004', 'device_type': 'hvac', 'location': 'Zone D - Office', 
             'manufacturer': 'Lennox', 'model': 'HVAC-L1', 'max_current': 20.0, 'max_temperature': 38.0, 'max_pressure': 4.0},
            
            # Lighting Systems - Energy Efficient
            {'device_id': 'LIGHT_001', 'device_type': 'lighting', 'location': 'Warehouse Section 1', 
             'manufacturer': 'Philips', 'model': 'LED-Array-1', 'max_current': 5.0, 'max_temperature': 35.0, 'max_pressure': 0.0},
            {'device_id': 'LIGHT_002', 'device_type': 'lighting', 'location': 'Warehouse Section 2', 
             'manufacturer': 'GE', 'model': 'LED-Array-2', 'max_current': 7.0, 'max_temperature': 40.0, 'max_pressure': 0.0},
            {'device_id': 'LIGHT_003', 'device_type': 'lighting', 'location': 'Production Floor', 
             'manufacturer': 'Osram', 'model': 'LED-Ind-1', 'max_current': 12.0, 'max_temperature': 45.0, 'max_pressure': 0.0},
            {'device_id': 'LIGHT_004', 'device_type': 'lighting', 'location': 'Outdoor Perimeter', 
             'manufacturer': 'Cree', 'model': 'LED-Out-1', 'max_current': 15.0, 'max_temperature': 50.0, 'max_pressure': 0.0},
            
            # Pumps - Fluid Systems
            {'device_id': 'PUMP_001', 'device_type': 'pump', 'location': 'Water Supply System', 
             'manufacturer': 'Grundfos', 'model': 'Pump-A1', 'max_current': 12.0, 'max_temperature': 60.0, 'max_pressure': 15.0},
            {'device_id': 'PUMP_002', 'device_type': 'pump', 'location': 'Cooling Water System', 
             'manufacturer': 'Flygt', 'model': 'Pump-B2', 'max_current': 18.0, 'max_temperature': 65.0, 'max_pressure': 20.0},
            {'device_id': 'PUMP_003', 'device_type': 'pump', 'location': 'Process Water Recycle', 
             'manufacturer': 'KSB', 'model': 'Pump-K1', 'max_current': 22.0, 'max_temperature': 70.0, 'max_pressure': 25.0},
            {'device_id': 'PUMP_004', 'device_type': 'pump', 'location': 'Fire Protection System', 
             'manufacturer': 'Sulzer', 'model': 'Pump-S1', 'max_current': 28.0, 'max_temperature': 55.0, 'max_pressure': 30.0},
            
            # Compressors - High Power Equipment
            {'device_id': 'COMPRESSOR_001', 'device_type': 'compressor', 'location': 'Main Air System', 
             'manufacturer': 'Atlas Copco', 'model': 'Comp-C1', 'max_current': 35.0, 'max_temperature': 90.0, 'max_pressure': 25.0},
            {'device_id': 'COMPRESSOR_002', 'device_type': 'compressor', 'location': 'Process Air System', 
             'manufacturer': 'Ingersoll Rand', 'model': 'Comp-I1', 'max_current': 40.0, 'max_temperature': 95.0, 'max_pressure': 30.0},
            {'device_id': 'COMPRESSOR_003', 'device_type': 'compressor', 'location': 'Backup Air System', 
             'manufacturer': 'Kaeser', 'model': 'Comp-K1', 'max_current': 32.0, 'max_temperature': 88.0, 'max_pressure': 22.0},
            
            # Conveyors - Material Handling
            {'device_id': 'CONVEYOR_001', 'device_type': 'conveyor', 'location': 'Assembly Line Main', 
             'manufacturer': 'Dematic', 'model': 'Conv-D1', 'max_current': 8.0, 'max_temperature': 50.0, 'max_pressure': 2.0},
            {'device_id': 'CONVEYOR_002', 'device_type': 'conveyor', 'location': 'Packaging Line Belt', 
             'manufacturer': 'Siemens', 'model': 'Conv-D2', 'max_current': 10.0, 'max_temperature': 55.0, 'max_pressure': 3.0},
            {'device_id': 'CONVEYOR_003', 'device_type': 'conveyor', 'location': 'Warehouse Distribution', 
             'manufacturer': 'Honeywell', 'model': 'Conv-H1', 'max_current': 12.0, 'max_temperature': 52.0, 'max_pressure': 2.5},
            {'device_id': 'CONVEYOR_004', 'device_type': 'conveyor', 'location': 'Raw Material Intake', 
             'manufacturer': 'BEUMER', 'model': 'Conv-B1', 'max_current': 15.0, 'max_temperature': 58.0, 'max_pressure': 4.0},
            
            # Additional Industrial Equipment
            {'device_id': 'CHILLER_001', 'device_type': 'hvac', 'location': 'Central Chiller Plant', 
             'manufacturer': 'Johnson Controls', 'model': 'Chiller-J1', 'max_current': 45.0, 'max_temperature': 35.0, 'max_pressure': 8.0},
            {'device_id': 'FAN_001', 'device_type': 'motor', 'location': 'Exhaust Fan System', 
             'manufacturer': 'Greenheck', 'model': 'Fan-G1', 'max_current': 8.0, 'max_temperature': 65.0, 'max_pressure': 1.5},
            {'device_id': 'BOILER_001', 'device_type': 'compressor', 'location': 'Steam Generation Plant', 
             'manufacturer': 'Cleaver-Brooks', 'model': 'Boiler-C1', 'max_current': 25.0, 'max_temperature': 120.0, 'max_pressure': 15.0}
        ]
        
        # Create device simulators
        for config in device_configs:
            device = IoTDeviceSimulator(config)
            self.devices.append(device)
        
        logger.info(f"Initialized {len(self.devices)} IoT device simulators")
    
    def start_simulation(self, interval=3):
        """Start generating enhanced sensor data with better monitoring"""
        self.running = True
        logger.info(f"Starting enhanced IoT sensor data simulation with {len(self.devices)} devices...")
        logger.info(f"Data generation interval: {interval} seconds")
        
        # Statistics tracking
        messages_sent = 0
        errors_encountered = 0
        last_stats_time = time.time()
        
        def send_data():
            nonlocal messages_sent, errors_encountered, last_stats_time
            
            while self.running:
                batch_start = time.time()
                batch_success = 0
                batch_errors = 0
                
                for device in self.devices:
                    if device.is_active and not device.maintenance_mode:
                        try:
                            # Generate enhanced sensor reading
                            sensor_data = device.generate_sensor_reading()
                            
                            # Send to Kafka
                            self.producer.send(
                                topic='sensor-data',
                                key=device.device_id,
                                value=sensor_data
                            )
                            
                            batch_success += 1
                            messages_sent += 1
                            
                            # Simulate device maintenance scheduling
                            if sensor_data['status'] == 'maintenance_required' and random.random() < 0.1:
                                device.last_maintenance = datetime.utcnow()
                                device.operating_hours = 0
                                logger.info(f"Scheduled maintenance for {device.device_id}")
                            
                        except Exception as e:
                            batch_errors += 1
                            errors_encountered += 1
                            logger.error(f"Error sending data for {device.device_id}: {e}")
                
                # Flush producer to ensure messages are sent
                try:
                    self.producer.flush(timeout=5)
                except Exception as e:
                    logger.error(f"Error flushing Kafka producer: {e}")
                
                # Log statistics every 60 seconds
                current_time = time.time()
                if current_time - last_stats_time >= 60:
                    logger.info(f"Simulation Stats - Messages sent: {messages_sent}, Errors: {errors_encountered}, Rate: {messages_sent/60:.1f}/min")
                    last_stats_time = current_time
                    messages_sent = 0  # Reset counter for next period
                    errors_encountered = 0
                
                # Smart interval adjustment based on batch processing time
                batch_time = time.time() - batch_start
                sleep_time = max(0.1, interval - batch_time)
                time.sleep(sleep_time)
        
        # Start data generation in separate thread
        thread = threading.Thread(target=send_data, name="SensorDataGenerator")
        thread.daemon = True
        thread.start()
        
        return thread

def main():
    """Enhanced main function with better configuration and monitoring"""
    # Get configuration from environment
    kafka_servers = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'kafka:29092')
    data_interval = float(os.getenv('SENSOR_DATA_INTERVAL', '2.0'))  # seconds
    log_level = os.getenv('LOG_LEVEL', 'INFO')
    
    # Configure logging level
    logging.getLogger().setLevel(getattr(logging, log_level.upper()))
    
    logger.info("=== Enhanced IoT Sensor Simulator Starting ===")
    logger.info(f"Kafka servers: {kafka_servers}")
    logger.info(f"Data generation interval: {data_interval} seconds")
    logger.info(f"Log level: {log_level}")
    
    # Initialize and start simulator with retry logic
    max_retries = 5
    retry_delay = 10
    
    for attempt in range(max_retries):
        try:
            producer = SensorDataProducer(kafka_servers)
            logger.info(f"Successfully connected to Kafka on attempt {attempt + 1}")
            break
        except Exception as e:
            logger.error(f"Failed to connect to Kafka (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                logger.info(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                logger.error("Max retries reached. Exiting.")
                return
    
    try:
        # Start simulation
        thread = producer.start_simulation(interval=data_interval)
        
        logger.info("Simulation started successfully!")
        logger.info("Press Ctrl+C to stop the simulation")
        
        # Keep the main thread alive with enhanced monitoring
        stats_counter = 0
        while True:
            time.sleep(30)
            stats_counter += 1
            
            if stats_counter % 2 == 0:  # Every minute
                active_devices = sum(1 for d in producer.devices if d.is_active)
                maintenance_devices = sum(1 for d in producer.devices if d.maintenance_mode)
                logger.info(f"Status: {active_devices} active devices, {maintenance_devices} in maintenance")
                
                # Log device status summary
                status_counts = {}
                anomaly_counts = {}
                for device in producer.devices:
                    # This would require storing the last status, so let's simplify
                    pass
            
    except KeyboardInterrupt:
        logger.info("Received shutdown signal...")
    except Exception as e:
        logger.error(f"Unexpected error in main loop: {e}")
    finally:
        logger.info("Shutting down sensor simulator...")
        producer.stop_simulation()
        logger.info("Sensor simulator stopped successfully")

if __name__ == '__main__':
    main()