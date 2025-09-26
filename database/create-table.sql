-- IoT Energy Monitoring Database Schema

-- Devices table
CREATE TABLE IF NOT EXISTS devices (
    device_id VARCHAR(50) PRIMARY KEY,
    device_type VARCHAR(50) NOT NULL,
    location VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(50),
    model VARCHAR(50),
    installation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    max_current FLOAT,
    max_temperature FLOAT,
    max_pressure FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sensor data table (time-series data)
CREATE TABLE IF NOT EXISTS sensor_data (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) REFERENCES devices(device_id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    current_value FLOAT NOT NULL,
    temperature FLOAT NOT NULL,
    pressure FLOAT NOT NULL,
    energy_consumption FLOAT,
    status VARCHAR(20) DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) REFERENCES devices(device_id),
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Energy consumption aggregates
CREATE TABLE IF NOT EXISTS energy_consumption_hourly (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) REFERENCES devices(device_id),
    hour_timestamp TIMESTAMP NOT NULL,
    total_consumption FLOAT NOT NULL,
    avg_current FLOAT,
    avg_temperature FLOAT,
    avg_pressure FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Device control logs
CREATE TABLE IF NOT EXISTS device_control_logs (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) REFERENCES devices(device_id),
    action VARCHAR(50) NOT NULL,
    performed_by VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    result VARCHAR(20) NOT NULL,
    notes TEXT
);

-- ML predictions
CREATE TABLE IF NOT EXISTS ml_predictions (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) REFERENCES devices(device_id),
    prediction_type VARCHAR(50) NOT NULL,
    predicted_value FLOAT,
    confidence_score FLOAT,
    prediction_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actual_value FLOAT,
    model_version VARCHAR(20)
);

-- Optimization recommendations
CREATE TABLE IF NOT EXISTS optimization_recommendations (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) REFERENCES devices(device_id),
    recommendation_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    potential_savings FLOAT,
    priority VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    implemented_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sensor_data_device_timestamp ON sensor_data(device_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_sensor_data_timestamp ON sensor_data(timestamp);
CREATE INDEX IF NOT EXISTS idx_alerts_device_timestamp ON alerts(device_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_energy_consumption_device_hour ON energy_consumption_hourly(device_id, hour_timestamp);

-- Insert sample device data
INSERT INTO devices (device_id, device_type, location, manufacturer, model, max_current, max_temperature, max_pressure) VALUES
('MOTOR_001', 'motor', 'Production Line 1', 'Siemens', 'Motor-X1', 15.0, 80.0, 10.0),
('MOTOR_002', 'motor', 'Production Line 2', 'ABB', 'Motor-Y2', 20.0, 85.0, 12.0),
('HVAC_001', 'hvac', 'Zone A', 'Carrier', 'HVAC-Z1', 25.0, 40.0, 5.0),
('HVAC_002', 'hvac', 'Zone B', 'Trane', 'HVAC-Z2', 30.0, 45.0, 6.0),
('LIGHT_001', 'lighting', 'Warehouse 1', 'Philips', 'LED-Array-1', 5.0, 35.0, 0.0),
('LIGHT_002', 'lighting', 'Warehouse 2', 'GE', 'LED-Array-2', 7.0, 40.0, 0.0),
('PUMP_001', 'pump', 'Water System', 'Grundfos', 'Pump-A1', 12.0, 60.0, 15.0),
('PUMP_002', 'pump', 'Cooling System', 'Flygt', 'Pump-B2', 18.0, 65.0, 20.0),
('COMPRESSOR_001', 'compressor', 'Air System', 'Atlas Copco', 'Comp-C1', 35.0, 90.0, 25.0),
('CONVEYOR_001', 'conveyor', 'Assembly Line', 'Dematic', 'Conv-D1', 8.0, 50.0, 2.0)
ON CONFLICT (device_id) DO NOTHING;