// API Response Types
export interface DeviceStatus {
  device_id: string;
  device_type: string;
  avg_current: number;
  avg_temperature: number;
  avg_pressure: number;
  reading_count: number;
  last_seen: string;
}

export interface SensorReading {
  id: number;
  device_id: string;
  device_type: string;
  current: number;
  temperature: number;
  pressure: number;
  relay_status: string;
  is_active: number;
  maintenance_required: number;
  timestamp: string;
  created_at: string;
}

export interface AnalyticsOverview {
  active_devices: number;
  alert_counts: {
    high_current: number;
    high_temperature: number;
    high_pressure: number;
  };
  averages: {
    current: number;
    temperature: number;
    pressure: number;
  };
  total_readings: number;
}

export interface ApiResponse<T> {
  status: string;
  data?: T;
  devices?: T;
  readings?: T;
  analytics?: T;
  message?: string;
}