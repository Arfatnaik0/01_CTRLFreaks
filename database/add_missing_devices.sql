-- Add the missing devices that the simulator generates
INSERT INTO devices (device_id, device_type, location, manufacturer, model, max_current, max_temperature, max_pressure, status, installation_date) VALUES
-- Missing HVAC device
('HVAC_004', 'hvac', 'Zone D - Office', 'Lennox', 'HVAC-L1', 20.0, 38.0, 4.0, 'active', '2023-04-15'),

-- Missing Lighting device  
('LIGHT_004', 'lighting', 'Outdoor Perimeter', 'Cree', 'LED-Out-1', 15.0, 50.0, 0.0, 'active', '2023-03-28'),

-- Missing Conveyor device
('CONVEYOR_004', 'conveyor', 'Raw Material Intake', 'BEUMER', 'Conv-B1', 15.0, 58.0, 4.0, 'active', '2023-04-02'),

-- Additional Industrial Equipment
('CHILLER_001', 'hvac', 'Central Chiller Plant', 'Johnson Controls', 'Chiller-J1', 45.0, 35.0, 8.0, 'active', '2023-02-05'),
('FAN_001', 'motor', 'Exhaust Fan System', 'Greenheck', 'Fan-G1', 8.0, 65.0, 1.5, 'active', '2023-03-12'),
('BOILER_001', 'compressor', 'Steam Generation Plant', 'Cleaver-Brooks', 'Boiler-C1', 25.0, 120.0, 15.0, 'active', '2023-01-18');

COMMIT;