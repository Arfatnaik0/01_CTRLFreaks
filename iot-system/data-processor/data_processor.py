import json
import time
import logging
import os
from datetime import datetime, timedelta
from kafka import KafkaConsumer
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import threading
from queue import Queue
import statistics
from collections import defaultdict, deque

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DatabaseManager:
    """Handles all database operations with connection pooling"""
    
    def __init__(self, database_url):
        self.database_url = database_url
        self.connection = None
        self.connect()
    
    def connect(self):
        """Establish database connection"""
        try:
            self.connection = psycopg2.connect(self.database_url)
            self.connection.autocommit = False
            logger.info("Database connection established")
        except Exception as e:
            logger.error(f"Database connection failed: {e}")
            raise
    
    def ensure_connection(self):
        """Ensure database connection is active"""
        try:
            if self.connection.closed:
                self.connect()
            else:
                # Test connection
                with self.connection.cursor() as cursor:
                    cursor.execute("SELECT 1")
        except Exception as e:
            logger.warning(f"Connection test failed, reconnecting: {e}")
            self.connect()
    
    def batch_insert_sensor_data(self, sensor_readings):
        """Batch insert sensor readings for better performance"""
        if not sensor_readings:
            return
        
        self.ensure_connection()
        
        try:
            with self.connection.cursor() as cursor:
                # Prepare batch insert query
                insert_query = """
                    INSERT INTO sensor_data 
                    (device_id, timestamp, current_value, temperature, pressure, energy_consumption, status)
                    VALUES %s
                    ON CONFLICT DO NOTHING
                """
                
                # Prepare values
                values = []
                for reading in sensor_readings:
                    values.append((
                        reading['device_id'],
                        reading['timestamp'],
                        reading['current_value'],
                        reading['temperature'],
                        reading['pressure'],
                        reading['energy_consumption'],
                        reading['status']
                    ))
                
                # Execute batch insert
                from psycopg2.extras import execute_values
                execute_values(cursor, insert_query, values, template=None, page_size=100)
                
                self.connection.commit()
                logger.info(f"Inserted {len(sensor_readings)} sensor readings")
                
        except Exception as e:
            self.connection.rollback()
            logger.error(f"Batch insert failed: {e}")
            raise
    
    def insert_alert(self, alert_data):
        """Insert alert into database"""
        self.ensure_connection()
        
        try:
            with self.connection.cursor() as cursor:
                insert_query = """
                    INSERT INTO alerts (device_id, alert_type, severity, message, timestamp)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id
                """
                cursor.execute(insert_query, (
                    alert_data['device_id'],
                    alert_data['alert_type'],
                    alert_data['severity'],
                    alert_data['message'],
                    alert_data['timestamp']
                ))
                
                alert_id = cursor.fetchone()[0]
                self.connection.commit()
                logger.info(f"Alert {alert_id} created for device {alert_data['device_id']}")
                return alert_id
                
        except Exception as e:
            self.connection.rollback()
            logger.error(f"Alert insertion failed: {e}")
            return None
    
    def update_energy_aggregates(self, aggregates):
        """Update hourly energy consumption aggregates"""
        if not aggregates:
            return
        
        self.ensure_connection()
        
        try:
            with self.connection.cursor() as cursor:
                for device_id, data in aggregates.items():
                    upsert_query = """
                        INSERT INTO energy_consumption_hourly 
                        (device_id, hour_timestamp, total_consumption, avg_current, avg_temperature, avg_pressure)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        ON CONFLICT (device_id, hour_timestamp) 
                        DO UPDATE SET 
                            total_consumption = EXCLUDED.total_consumption,
                            avg_current = EXCLUDED.avg_current,
                            avg_temperature = EXCLUDED.avg_temperature,
                            avg_pressure = EXCLUDED.avg_pressure
                    """
                    
                    cursor.execute(upsert_query, (
                        device_id,
                        data['hour_timestamp'],
                        data['total_consumption'],
                        data['avg_current'],
                        data['avg_temperature'],
                        data['avg_pressure']
                    ))
                
                self.connection.commit()
                logger.info(f"Updated energy aggregates for {len(aggregates)} devices")
                
        except Exception as e:
            self.connection.rollback()
            logger.error(f"Energy aggregates update failed: {e}")

class AnomalyDetector:
    """Real-time anomaly detection system"""
    
    def __init__(self):
        # Store recent readings for each device (sliding window)
        self.device_windows = defaultdict(lambda: deque(maxlen=20))
        self.device_baselines = defaultdict(dict)
        self.alert_cooldown = defaultdict(float)  # Prevent spam alerts
        
    def update_baseline(self, device_id, current, temperature, pressure):
        """Update baseline statistics for anomaly detection"""
        window = self.device_windows[device_id]
        window.append({
            'current': current,
            'temperature': temperature, 
            'pressure': pressure,
            'timestamp': time.time()
        })
        
        if len(window) >= 10:  # Need minimum readings for baseline
            currents = [r['current'] for r in window]
            temps = [r['temperature'] for r in window]
            pressures = [r['pressure'] for r in window]
            
            self.device_baselines[device_id] = {
                'current_mean': statistics.mean(currents),
                'current_stdev': statistics.stdev(currents) if len(currents) > 1 else 0,
                'temp_mean': statistics.mean(temps),
                'temp_stdev': statistics.stdev(temps) if len(temps) > 1 else 0,
                'pressure_mean': statistics.mean(pressures),
                'pressure_stdev': statistics.stdev(pressures) if len(pressures) > 1 else 0,
            }
    
    def detect_anomalies(self, reading):
        """Detect anomalies in sensor reading"""
        device_id = reading['device_id']
        current_time = time.time()
        
        # Update baseline
        self.update_baseline(device_id, reading['current_value'], 
                           reading['temperature'], reading['pressure'])
        
        alerts = []
        
        # Check cooldown period (prevent spam)
        if current_time - self.alert_cooldown.get(device_id, 0) < 300:  # 5 minutes
            return alerts
        
        baseline = self.device_baselines.get(device_id)
        if not baseline:
            return alerts
        
        # Statistical anomaly detection (3-sigma rule)
        anomalies_detected = []
        
        # Current anomaly
        if baseline['current_stdev'] > 0:
            current_zscore = abs(reading['current_value'] - baseline['current_mean']) / baseline['current_stdev']
            if current_zscore > 3:
                anomalies_detected.append(('current', current_zscore))
        
        # Temperature anomaly  
        if baseline['temp_stdev'] > 0:
            temp_zscore = abs(reading['temperature'] - baseline['temp_mean']) / baseline['temp_stdev']
            if temp_zscore > 3:
                anomalies_detected.append(('temperature', temp_zscore))
        
        # Pressure anomaly
        if baseline['pressure_stdev'] > 0:
            pressure_zscore = abs(reading['pressure'] - baseline['pressure_mean']) / baseline['pressure_stdev']
            if pressure_zscore > 3:
                anomalies_detected.append(('pressure', pressure_zscore))
        
        # Generate alerts for detected anomalies
        for metric, zscore in anomalies_detected:
            severity = 'critical' if zscore > 4 else 'warning'
            alerts.append({
                'device_id': device_id,
                'alert_type': f'{metric}_anomaly',
                'severity': severity,
                'message': f'Unusual {metric} detected (Z-score: {zscore:.2f})',
                'timestamp': reading['timestamp']
            })
            
            self.alert_cooldown[device_id] = current_time
        
        return alerts

class EnergyAnalyzer:
    """Energy consumption analysis and aggregation"""
    
    def __init__(self):
        self.hourly_data = defaultdict(lambda: defaultdict(list))
        self.last_aggregate_time = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
    
    def add_reading(self, reading):
        """Add reading to energy analysis"""
        timestamp = datetime.fromisoformat(reading['timestamp'].replace('Z', '+00:00'))
        hour_key = timestamp.replace(minute=0, second=0, microsecond=0)
        device_id = reading['device_id']
        
        self.hourly_data[hour_key][device_id].append({
            'energy_consumption': reading['energy_consumption'],
            'current_value': reading['current_value'],
            'temperature': reading['temperature'],
            'pressure': reading['pressure']
        })
    
    def get_hourly_aggregates(self):
        """Calculate hourly aggregates and return completed hours"""
        current_time = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
        aggregates = {}
        
        # Process completed hours only
        for hour_key in list(self.hourly_data.keys()):
            if hour_key < current_time:  # Only process completed hours
                for device_id, readings in self.hourly_data[hour_key].items():
                    if readings:  # Has data
                        aggregates[f"{device_id}_{hour_key}"] = {
                            'device_id': device_id,
                            'hour_timestamp': hour_key,
                            'total_consumption': sum(r['energy_consumption'] for r in readings),
                            'avg_current': statistics.mean(r['current_value'] for r in readings),
                            'avg_temperature': statistics.mean(r['temperature'] for r in readings),
                            'avg_pressure': statistics.mean(r['pressure'] for r in readings)
                        }
                
                # Clean up processed data
                del self.hourly_data[hour_key]
        
        return aggregates

class DataProcessor:
    """Main data processing service"""
    
    def __init__(self):
        # Configuration
        self.kafka_servers = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'kafka:29092')
        self.database_url = os.getenv('DATABASE_URL', 'postgresql://iot_user:iot_password@localhost:5432/iot_energy_db')
        self.redis_url = os.getenv('REDIS_URL', 'redis://redis:6379')
        
        # Initialize components
        self.db_manager = DatabaseManager(self.database_url)
        self.anomaly_detector = AnomalyDetector()
        self.energy_analyzer = EnergyAnalyzer()
        
        # Processing queues
        self.processing_queue = Queue(maxsize=1000)
        self.alert_queue = Queue(maxsize=100)
        
        # Statistics
        self.messages_processed = 0
        self.alerts_generated = 0
        self.batch_size = 50
        self.processing_batch = []
        
        # Redis connection for caching
        try:
            self.redis_client = redis.Redis.from_url(self.redis_url)
            self.redis_client.ping()
            logger.info("Redis connection established")
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}")
            self.redis_client = None
    
    def start_kafka_consumer(self):
        """Start Kafka consumer in separate thread"""
        def consume_messages():
            max_retries = 5
            retry_delay = 10
            
            for attempt in range(max_retries):
                try:
                    consumer = KafkaConsumer(
                        'sensor-data',
                        bootstrap_servers=self.kafka_servers,
                        value_deserializer=lambda x: json.loads(x.decode('utf-8')),
                        auto_offset_reset='latest',
                        group_id='data-processor-group',
                        enable_auto_commit=True
                    )
                    
                    logger.info(f"Kafka consumer connected on attempt {attempt + 1}")
                    
                    for message in consumer:
                        try:
                            sensor_data = message.value
                            self.processing_queue.put(sensor_data, timeout=1)
                            
                        except Exception as e:
                            logger.error(f"Message processing error: {e}")
                    
                    break  # Exit retry loop if successful
                    
                except Exception as e:
                    logger.error(f"Kafka consumer failed (attempt {attempt + 1}/{max_retries}): {e}")
                    if attempt < max_retries - 1:
                        logger.info(f"Retrying in {retry_delay} seconds...")
                        time.sleep(retry_delay)
                    else:
                        logger.error("Max retries reached for Kafka consumer")
        
        consumer_thread = threading.Thread(target=consume_messages, name="KafkaConsumer")
        consumer_thread.daemon = True
        consumer_thread.start()
        return consumer_thread
    
    def start_data_processor(self):
        """Start main data processing loop"""
        def process_data():
            last_batch_time = time.time()
            last_aggregate_time = time.time()
            
            while True:
                try:
                    # Get sensor reading from queue
                    if not self.processing_queue.empty():
                        reading = self.processing_queue.get(timeout=5)
                        
                        # Add to processing batch
                        self.processing_batch.append(reading)
                        
                        # Process anomalies
                        alerts = self.anomaly_detector.detect_anomalies(reading)
                        for alert in alerts:
                            self.alert_queue.put(alert)
                        
                        # Add to energy analyzer
                        self.energy_analyzer.add_reading(reading)
                        
                        self.messages_processed += 1
                        
                    # Batch processing - process when batch is full or time elapsed
                    current_time = time.time()
                    if (len(self.processing_batch) >= self.batch_size or 
                        (self.processing_batch and current_time - last_batch_time > 30)):
                        
                        # Batch insert sensor data
                        self.db_manager.batch_insert_sensor_data(self.processing_batch)
                        self.processing_batch.clear()
                        last_batch_time = current_time
                    
                    # Process hourly aggregates every 5 minutes
                    if current_time - last_aggregate_time > 300:  # 5 minutes
                        aggregates = self.energy_analyzer.get_hourly_aggregates()
                        if aggregates:
                            self.db_manager.update_energy_aggregates(aggregates)
                        last_aggregate_time = current_time
                    
                except Exception as e:
                    logger.error(f"Data processing error: {e}")
                    time.sleep(1)
        
        processor_thread = threading.Thread(target=process_data, name="DataProcessor")
        processor_thread.daemon = True
        processor_thread.start()
        return processor_thread
    
    def start_alert_processor(self):
        """Process alerts in separate thread"""
        def process_alerts():
            while True:
                try:
                    if not self.alert_queue.empty():
                        alert = self.alert_queue.get(timeout=5)
                        alert_id = self.db_manager.insert_alert(alert)
                        if alert_id:
                            self.alerts_generated += 1
                            
                            # Cache recent alerts in Redis
                            if self.redis_client:
                                try:
                                    alert_key = f"alert:{alert['device_id']}:latest"
                                    self.redis_client.setex(alert_key, 3600, json.dumps(alert))
                                except Exception as e:
                                    logger.warning(f"Redis alert caching failed: {e}")
                    
                except Exception as e:
                    logger.error(f"Alert processing error: {e}")
                    time.sleep(1)
        
        alert_thread = threading.Thread(target=process_alerts, name="AlertProcessor")
        alert_thread.daemon = True
        alert_thread.start()
        return alert_thread
    
    def start_statistics_reporter(self):
        """Report processing statistics"""
        def report_stats():
            last_processed = 0
            last_alerts = 0
            
            while True:
                time.sleep(60)  # Report every minute
                
                current_processed = self.messages_processed
                current_alerts = self.alerts_generated
                
                processing_rate = current_processed - last_processed
                alert_rate = current_alerts - last_alerts
                
                logger.info(f"Processing Stats - Messages: {processing_rate}/min, "
                           f"Total: {current_processed}, Alerts: {alert_rate}/min, "
                           f"Queue size: {self.processing_queue.qsize()}")
                
                last_processed = current_processed
                last_alerts = current_alerts
        
        stats_thread = threading.Thread(target=report_stats, name="StatsReporter")
        stats_thread.daemon = True
        stats_thread.start()
        return stats_thread
    
    def start(self):
        """Start all processing components"""
        logger.info("=== Starting Data Processor Service ===")
        
        # Start all threads
        kafka_thread = self.start_kafka_consumer()
        processor_thread = self.start_data_processor()
        alert_thread = self.start_alert_processor()
        stats_thread = self.start_statistics_reporter()
        
        logger.info("All processing threads started successfully")
        
        return {
            'kafka_consumer': kafka_thread,
            'data_processor': processor_thread,
            'alert_processor': alert_thread,
            'stats_reporter': stats_thread
        }

def main():
    """Main function"""
    logger.info("=== IoT Data Processor Starting ===")
    
    processor = DataProcessor()
    
    try:
        threads = processor.start()
        
        logger.info("Data processor is running. Press Ctrl+C to stop.")
        
        # Keep main thread alive
        while True:
            time.sleep(30)
            # Health check - ensure threads are alive
            for name, thread in threads.items():
                if not thread.is_alive():
                    logger.error(f"Thread {name} has died!")
    
    except KeyboardInterrupt:
        logger.info("Shutting down data processor...")
    except Exception as e:
        logger.error(f"Fatal error: {e}")
    finally:
        logger.info("Data processor stopped")

if __name__ == '__main__':
    main()