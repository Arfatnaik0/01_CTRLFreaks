/**
 * Email Service for sending critical sensor alerts
 * Uses EmailJS to send emails directly from frontend
 */

// EmailJS configuration - Free tier allows 200 emails/month
const EMAILJS_CONFIG = {
  serviceId: 'service_iot_alerts',
  templateId: 'template_critical_alert',
  publicKey: 'YOUR_PUBLIC_KEY', // Will be set up through EmailJS dashboard
};

class EmailService {
  constructor() {
    this.lastEmailSent = null;
    this.emailCooldown = 12 * 60 * 60 * 1000; // 12 hours between emails
    this.initialEmailSent = false; // Track if initial email has been sent
    this.useEmailJS = false; // Set to true after EmailJS setup
  }

  /**
   * Check if enough time has passed since last email
   */
  canSendEmail() {
    // Always allow initial email
    if (!this.initialEmailSent) {
      return true;
    }
    
    // For subsequent emails, check 12-hour cooldown
    if (!this.lastEmailSent) return true;
    return Date.now() - this.lastEmailSent > this.emailCooldown;
  }

  /**
   * Send email using EmailJS (disabled - requires npm package)
   * To enable: npm install @emailjs/browser, then set useEmailJS = true
   */
  async sendViaEmailJS(criticalDevices) {
    console.log('EmailJS not configured. Skipping. Install @emailjs/browser to enable.');
    throw new Error('EmailJS not available');
  }

  /**
   * Send email using Web3Forms (backup method)
   * Get your free access key at: https://web3forms.com/
   */
  async sendViaWeb3Forms(criticalDevices) {
    // To activate: Get free API key from https://web3forms.com/ and replace below
    const WEB3FORMS_KEY = 'e8d38b72-4f87-4e3d-891e-5a6f68e8d5a3'; // Free tier: unlimited emails
    
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          subject: `⚠️ Critical IoT Sensors Alert - ${criticalDevices.length} Devices Need Attention`,
          from_name: 'IoT Dashboard Alert System',
          to: 'arfatnaik800@gmail.com',
          message: this.formatEmailBody(criticalDevices),
        }),
      });

      const result = await response.json();
      if (result.success) {
        console.log('Email sent successfully via Web3Forms');
        return { success: true, method: 'web3forms' };
      } else {
        throw new Error(result.message || 'Failed to send email');
      }
    } catch (error) {
      console.error('Web3Forms error:', error);
      throw error;
    }
  }

  /**
   * Send email using FormSubmit (no API key needed!)
   * Free, unlimited emails with no signup required
   */
  async sendViaFormSubmit(criticalDevices) {
    try {
      const emailBody = this.formatEmailBody(criticalDevices);
      
      const response = await fetch('https://formsubmit.co/ajax/arfatnaik800@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `⚠️ Critical IoT Sensors Alert - ${criticalDevices.length} Devices Need Attention`,
          _template: 'box',
          _captcha: 'false',
          message: emailBody,
          critical_count: criticalDevices.length,
          timestamp: new Date().toLocaleString()
        }),
      });

      if (!response.ok) {
        throw new Error(`FormSubmit returned ${response.status}`);
      }

      const result = await response.json();
      if (result.success === 'true' || result.success === true) {
        console.log('Email sent successfully via FormSubmit');
        return { success: true, method: 'formsubmit' };
      } else {
        throw new Error('FormSubmit failed: ' + JSON.stringify(result));
      }
    } catch (error) {
      console.error('FormSubmit error:', error);
      throw error;
    }
  }

  /**
   * Main method to send critical device alerts
   */
  async sendCriticalAlert(criticalDevices) {
    if (criticalDevices.length === 0) {
      console.log('No critical devices to report');
      return { success: true, skipped: true };
    }

    if (!this.canSendEmail()) {
      const timeUntilNext = this.emailCooldown - (Date.now() - this.lastEmailSent);
      const hoursRemaining = Math.floor(timeUntilNext / (1000 * 60 * 60));
      const minutesRemaining = Math.floor((timeUntilNext % (1000 * 60 * 60)) / (1000 * 60));
      console.log(`Email cooldown active. Next email in ${hoursRemaining}h ${minutesRemaining}m`);
      return { success: true, skipped: true, reason: 'cooldown' };
    }

    const emailType = !this.initialEmailSent ? 'Initial alert' : 'Periodic update';
    console.log(`${emailType}: Sending alert for ${criticalDevices.length} critical devices...`);

    // Try methods in order of preference (FormSubmit first - no API key needed)
    const methods = [
      () => this.sendViaFormSubmit(criticalDevices),
    ];

    for (const method of methods) {
      try {
        const result = await method();
        if (result.success) {
          this.lastEmailSent = Date.now();
          this.initialEmailSent = true;
          const nextEmail = !this.initialEmailSent ? 'in 12 hours' : 'in 12 hours';
          console.log(`${emailType} sent successfully! Next email: ${nextEmail}`);
          return { ...result, isInitial: !this.initialEmailSent, nextEmailIn: '12 hours' };
        }
      } catch (error) {
        console.warn('Email method failed, trying next...', error);
        continue;
      }
    }

    throw new Error('All email methods failed');
  }

  /**
   * Format device list for email
   */
  formatDeviceList(devices) {
    return devices
      .map(
        (d, i) =>
          `${i + 1}. ${d.device_id} (${d.device_type})
   - Current: ${d.avg_current?.toFixed(2)}A ${d.avg_current > 20 ? '🔴 CRITICAL' : '⚠️'}
   - Temperature: ${d.avg_temperature?.toFixed(2)}°C ${d.avg_temperature > 35 ? '🔴 CRITICAL' : '⚠️'}
   - Status: ${d.current_status}
   - Maintenance Required: 'YES ⚠️'`
      )
      .join('\n\n');
  }

  /**
   * Format full email body
   */
  formatEmailBody(devices) {
    const timestamp = new Date().toLocaleString();
    const totalDevices = devices.length;
    const alertType = !this.initialEmailSent ? '🔔 INITIAL ALERT' : '📊 12-HOUR UPDATE';
    
    return `
${alertType}
⚠️ CRITICAL SENSORS ALERT ⚠️

Report Type: ${!this.initialEmailSent ? 'Initial Alert (Simulator Started)' : '12-Hour Periodic Update'}
Timestamp: ${timestamp}
Critical Devices Count: ${totalDevices}

The following IoT sensors have exceeded critical thresholds and require immediate maintenance:

${this.formatDeviceList(devices)}

---
Thresholds:
• Critical Current: > 20A
• Critical Temperature: > 35°C
• Warning Current: > 15A
• Warning Temperature: > 30°C

Please check the dashboard for real-time updates:
https://iot-frontend-gmny.onrender.com/

---
Email Schedule:
• Initial alert sent when simulator starts
• Periodic updates every 12 hours if critical devices remain

This is an automated alert from the IoT Monitoring System.
`;
  }
}

export const emailService = new EmailService();
