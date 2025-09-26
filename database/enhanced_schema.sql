-- Enhanced schema updates for Phase 4

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sensor_data_device_status ON sensor_data(device_id, status);
CREATE INDEX IF NOT EXISTS idx_sensor_data_energy_consumption ON sensor_data(energy_consumption);
CREATE INDEX IF NOT EXISTS idx_alerts_severity_timestamp ON alerts(severity, timestamp);
CREATE INDEX IF NOT EXISTS idx_alerts_device_resolved ON alerts(device_id, is_resolved);

-- Add constraints for data integrity
ALTER TABLE sensor_data ADD CONSTRAINT chk_positive_values 
CHECK (current_value >= 0 AND temperature >= -50 AND pressure >= 0);

-- Add alert categories table for better alert management
CREATE TABLE IF NOT EXISTS alert_categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(50) UNIQUE NOT NULL,
    default_severity VARCHAR(20) NOT NULL DEFAULT 'warning',
    description TEXT,
    auto_resolve BOOLEAN DEFAULT FALSE,
    cooldown_minutes INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default alert categories
INSERT INTO alert_categories (category_name, default_severity, description, auto_resolve, cooldown_minutes) VALUES
('current_anomaly', 'warning', 'Unusual current consumption detected', TRUE, 5),
('temperature_anomaly', 'warning', 'Unusual temperature readings detected', TRUE, 5),
('pressure_anomaly', 'warning', 'Unusual pressure readings detected', TRUE, 5),
('energy_spike', 'warning', 'Sudden increase in energy consumption', TRUE, 10),
('performance_degradation', 'maintenance', 'Device performance below optimal', FALSE, 60),
('maintenance_required', 'maintenance', 'Device requires scheduled maintenance', FALSE, 1440),
('system_failure', 'critical', 'Device system failure detected', FALSE, 0),
('efficiency_drop', 'warning', 'Device efficiency below threshold', TRUE, 30)
ON CONFLICT (category_name) DO NOTHING;

-- Enhanced device status tracking
CREATE TABLE IF NOT EXISTS device_status_history (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) REFERENCES devices(device_id),
    previous_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    status_duration INTEGER, -- seconds in previous status
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    trigger_reason VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_device_status_history ON device_status_history(device_id, changed_at);

-- Real-time dashboard metrics cache table
CREATE TABLE IF NOT EXISTS dashboard_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(50) NOT NULL,
    metric_value JSONB NOT NULL,
    device_id VARCHAR(50), -- NULL for global metrics
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    UNIQUE(metric_name, device_id)
);

CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_name ON dashboard_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_expires ON dashboard_metrics(expires_at);

-- Energy efficiency tracking
CREATE TABLE IF NOT EXISTS device_efficiency (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(50) REFERENCES devices(device_id),
    date_calculated DATE NOT NULL,
    efficiency_score DECIMAL(5,3), -- 0.000 to 1.000
    energy_consumed DECIMAL(10,3),
    energy_expected DECIMAL(10,3),
    operating_hours DECIMAL(6,2),
    calculation_method VARCHAR(50) DEFAULT 'baseline_comparison',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(device_id, date_calculated)
);

CREATE INDEX IF NOT EXISTS idx_device_efficiency_device_date ON device_efficiency(device_id, date_calculated);

-- Update the alerts table with enhanced fields
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS acknowledged_by VARCHAR(100);
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMP;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS auto_resolved BOOLEAN DEFAULT FALSE;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS parent_alert_id INTEGER REFERENCES alerts(id);

-- Update energy consumption hourly table with additional metrics
ALTER TABLE energy_consumption_hourly ADD COLUMN IF NOT EXISTS peak_current DECIMAL(8,3);
ALTER TABLE energy_consumption_hourly ADD COLUMN IF NOT EXISTS peak_temperature DECIMAL(6,2);
ALTER TABLE energy_consumption_hourly ADD COLUMN IF NOT EXISTS peak_pressure DECIMAL(6,2);
ALTER TABLE energy_consumption_hourly ADD COLUMN IF NOT EXISTS min_efficiency DECIMAL(5,3);
ALTER TABLE energy_consumption_hourly ADD COLUMN IF NOT EXISTS max_efficiency DECIMAL(5,3);
ALTER TABLE energy_consumption_hourly ADD COLUMN IF NOT EXISTS readings_count INTEGER DEFAULT 0;

-- Unique constraint for hourly data
ALTER TABLE energy_consumption_hourly DROP CONSTRAINT IF EXISTS unique_device_hour;
ALTER TABLE energy_consumption_hourly ADD CONSTRAINT unique_device_hour 
    UNIQUE(device_id, hour_timestamp);

-- Function to automatically update device status
CREATE OR REPLACE FUNCTION update_device_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update device status based on latest sensor reading
    UPDATE devices 
    SET status = CASE 
        WHEN NEW.status = 'critical' THEN 'critical'
        WHEN NEW.status = 'error' THEN 'error'
        WHEN NEW.status = 'maintenance_required' THEN 'maintenance'
        WHEN NEW.status = 'warning' THEN 'warning'
        ELSE 'active'
    END
    WHERE device_id = NEW.device_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update device status
DROP TRIGGER IF EXISTS trigger_update_device_status ON sensor_data;
CREATE TRIGGER trigger_update_device_status
    AFTER INSERT ON sensor_data
    FOR EACH ROW
    EXECUTE FUNCTION update_device_status();

-- Function to auto-resolve alerts
CREATE OR REPLACE FUNCTION auto_resolve_alerts()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-resolve previous alerts of same type if device status is normal
    IF NEW.status = 'normal' THEN
        UPDATE alerts 
        SET is_resolved = TRUE,
            resolved_at = CURRENT_TIMESTAMP,
            auto_resolved = TRUE
        WHERE device_id = NEW.device_id 
            AND is_resolved = FALSE 
            AND alert_type IN ('current_anomaly', 'temperature_anomaly', 'pressure_anomaly')
            AND timestamp > CURRENT_TIMESTAMP - INTERVAL '24 hours';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-resolving alerts
DROP TRIGGER IF EXISTS trigger_auto_resolve_alerts ON sensor_data;
CREATE TRIGGER trigger_auto_resolve_alerts
    AFTER INSERT ON sensor_data
    FOR EACH ROW
    EXECUTE FUNCTION auto_resolve_alerts();

-- View for real-time device summary
CREATE OR REPLACE VIEW device_summary AS
SELECT 
    d.device_id,
    d.device_type,
    d.location,
    d.status,
    s.current_value,
    s.temperature,
    s.pressure,
    s.energy_consumption,
    s.timestamp as last_reading,
    COALESCE(alert_count.count, 0) as active_alerts,
    CASE 
        WHEN s.timestamp < CURRENT_TIMESTAMP - INTERVAL '10 minutes' THEN 'offline'
        ELSE 'online'
    END as connectivity_status
FROM devices d
LEFT JOIN LATERAL (
    SELECT * FROM sensor_data 
    WHERE device_id = d.device_id 
    ORDER BY timestamp DESC 
    LIMIT 1
) s ON true
LEFT JOIN (
    SELECT device_id, COUNT(*) as count
    FROM alerts 
    WHERE is_resolved = FALSE 
    GROUP BY device_id
) alert_count ON d.device_id = alert_count.device_id;

-- View for energy efficiency summary
CREATE OR REPLACE VIEW energy_efficiency_summary AS
SELECT 
    device_id,
    AVG(efficiency_score) as avg_efficiency,
    MIN(efficiency_score) as min_efficiency,
    MAX(efficiency_score) as max_efficiency,
    SUM(energy_consumed) as total_energy,
    COUNT(*) as days_tracked
FROM device_efficiency 
WHERE date_calculated >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY device_id;

COMMIT;