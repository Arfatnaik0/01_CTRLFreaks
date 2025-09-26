-- Populate devices table with all 27 simulated devices

-- First clear existing devices to avoid conflicts
DELETE FROM sensor_data;
DELETE FROM alerts;
DELETE FROM devices;

-- Insert all 27 devices that match the simulator
INSERT INTO devices (device_id, device_type, location, manufacturer, model, max_current, max_temperature, max_pressure, status, installation_date) VALUES
-- Motors (6 devices)
('MOTOR_001', 'motor', 'Production Line A', 'Siemens', 'IE4-Super-Premium', 75.0, 120.0, 0.0, 'active', '2023-01-15'),
('MOTOR_002', 'motor', 'Production Line B', 'ABB', 'M3BP-355', 100.0, 130.0, 0.0, 'active', '2023-02-20'),
('MOTOR_003', 'motor', 'Conveyor System', 'WEG', 'W22-Premium', 50.0, 110.0, 0.0, 'active', '2023-03-10'),
('MOTOR_004', 'motor', 'Packaging Unit', 'Siemens', 'IE3-Standard', 30.0, 100.0, 0.0, 'active', '2023-04-05'),
('MOTOR_005', 'motor', 'Quality Control', 'ABB', 'M2BA-280', 25.0, 95.0, 0.0, 'active', '2023-05-12'),
('MOTOR_006', 'motor', 'Material Handler', 'WEG', 'W21-High-Efficiency', 60.0, 115.0, 0.0, 'active', '2023-06-08'),

-- Pumps (4 devices)
('PUMP_001', 'pump', 'Cooling System', 'Grundfos', 'CR-Vertical', 45.0, 80.0, 8.0, 'active', '2023-01-20'),
('PUMP_002', 'pump', 'Water Supply', 'Wilo', 'MHI-Horizontal', 60.0, 85.0, 10.0, 'active', '2023-02-15'),
('PUMP_003', 'pump', 'Chemical Processing', 'KSB', 'Etanorm', 80.0, 90.0, 12.0, 'active', '2023-03-22'),
('PUMP_004', 'pump', 'Waste Management', 'Flowserve', 'Mark-3', 55.0, 75.0, 6.0, 'active', '2023-04-18'),

-- HVAC Systems (3 devices)
('HVAC_001', 'hvac', 'Main Building', 'Carrier', 'AquaEdge-19DV', 120.0, 45.0, 0.0, 'active', '2023-01-10'),
('HVAC_002', 'hvac', 'Warehouse', 'Trane', 'Sintesis-Air', 150.0, 50.0, 0.0, 'active', '2023-02-25'),
('HVAC_003', 'hvac', 'Office Complex', 'York', 'YLAA-Air-Cooled', 100.0, 40.0, 0.0, 'active', '2023-03-30'),

-- Compressors (3 devices)
('COMPRESSOR_001', 'compressor', 'Production Floor', 'Atlas Copco', 'GA-VSD', 200.0, 100.0, 15.0, 'active', '2023-01-25'),
('COMPRESSOR_002', 'compressor', 'Pneumatic Tools', 'Ingersoll Rand', 'R-Series', 150.0, 95.0, 12.0, 'active', '2023-02-28'),
('COMPRESSOR_003', 'compressor', 'Spray Booth', 'Kaeser', 'CSD-Rotary', 180.0, 105.0, 18.0, 'active', '2023-03-15'),

-- Lighting Systems (3 devices)
('LIGHT_001', 'lighting', 'Production Area', 'Philips', 'GreenPerform-LED', 20.0, 60.0, 0.0, 'active', '2023-01-05'),
('LIGHT_002', 'lighting', 'Warehouse', 'Osram', 'PrevaLED-Linear', 15.0, 55.0, 0.0, 'active', '2023-02-10'),
('LIGHT_003', 'lighting', 'Office Spaces', 'Cree', 'SmartCast-Intelligence', 25.0, 65.0, 0.0, 'active', '2023-03-18'),

-- Conveyors (3 devices)
('CONVEYOR_001', 'conveyor', 'Assembly Line 1', 'FlexLink', 'X85-System', 40.0, 70.0, 0.0, 'active', '2023-01-30'),
('CONVEYOR_002', 'conveyor', 'Assembly Line 2', 'Dorner', '2200-Series', 35.0, 65.0, 0.0, 'active', '2023-02-20'),
('CONVEYOR_003', 'conveyor', 'Packaging Line', 'Hytrol', 'E24-EZLogic', 50.0, 75.0, 0.0, 'active', '2023-03-25'),

-- Sensors (3 devices)
('SENSOR_001', 'sensor', 'Temperature Monitor', 'Honeywell', 'TruStability-RSC', 5.0, 125.0, 0.0, 'active', '2023-01-12'),
('SENSOR_002', 'sensor', 'Pressure Monitor', 'Emerson', 'Rosemount-3051', 5.0, 85.0, 25.0, 'active', '2023-02-18'),
('SENSOR_003', 'sensor', 'Flow Monitor', 'Yokogawa', 'ADMAG-AXF', 5.0, 80.0, 0.0, 'active', '2023-03-08'),

-- Other Equipment (2 devices)
('WELDING_001', 'welding', 'Fabrication Shop', 'Lincoln Electric', 'Power Wave-S500', 500.0, 150.0, 0.0, 'active', '2023-01-28'),
('ROBOT_001', 'robot', 'Assembly Station', 'KUKA', 'KR-QUANTEC', 80.0, 70.0, 0.0, 'active', '2023-02-14');

-- Update device statistics
UPDATE devices SET 
    last_maintenance = CURRENT_TIMESTAMP - INTERVAL '15 days',
    next_maintenance = CURRENT_TIMESTAMP + INTERVAL '75 days'
WHERE last_maintenance IS NULL;

-- Create some recent maintenance records
INSERT INTO maintenance_records (device_id, maintenance_type, performed_date, performed_by, notes, cost) VALUES
('MOTOR_001', 'preventive', '2024-11-10', 'John Smith', 'Routine motor inspection and lubrication', 150.00),
('PUMP_001', 'corrective', '2024-11-15', 'Sarah Johnson', 'Replaced worn impeller', 450.00),
('HVAC_001', 'preventive', '2024-11-20', 'Mike Davis', 'Filter replacement and system check', 200.00),
('COMPRESSOR_001', 'preventive', '2024-11-12', 'Lisa Wilson', 'Oil change and pressure valve inspection', 300.00),
('CONVEYOR_001', 'corrective', '2024-11-18', 'Tom Brown', 'Belt tension adjustment', 75.00);

COMMIT;