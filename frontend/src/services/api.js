const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/api';

export class ApiService {
  static async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  static async getHealth() {
    return this.request('/health');
  }

  static async getDeviceStatus() {
    return this.request('/devices/status');
  }

  static async getLatestReadings() {
    return this.request('/latest-readings');
  }

  static async getAnalyticsOverview() {
    return this.request('/analytics/overview');
  }

  static async getDashboardData() {
    return this.request('/analytics/dashboard-data');
  }

  static async getDeviceReadings(deviceId, limit = 50) {
    return this.request(`/device/${deviceId}/readings?limit=${limit}`);
  }

  static async controlDevice(deviceId, command, value) {
    return this.request(`/device/${deviceId}/control`, {
      method: 'POST',
      body: JSON.stringify({ command, value }),
    });
  }

  static async toggleRelay(deviceId, status) {
    return this.request(`/device/${deviceId}/relay`, {
      method: 'PUT',
      body: JSON.stringify({ relay_status: status }),
    });
  }

  static async getControlCommands() {
    return this.request('/control-commands');
  }
}