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
    this.emailCooldown = 5 * 60 * 1000; // 5 minutes between emails
    this.useEmailJS = false; // Set to true after EmailJS setup
  }

  /**
   * Check if enough time has passed since last email
   */
  canSendEmail() {
    if (!this.lastEmailSent) return true;
    return Date.now() - this.lastEmailSent > this.emailCooldown;
  }

  /**
   * Send email using EmailJS
   */
  async sendViaEmailJS(criticalDevices) {
    if (!this.useEmailJS) {
      console.log('EmailJS not configured. Email would have been sent with:', {
        critical_count: criticalDevices.length,
        devices: criticalDevices.map(d => d.device_id).join(', ')
      });
      return { success: true, method: 'disabled' };
    }

    try {
      const { default: emailjs } = await import('@emailjs/browser');
      
      const templateParams = {
        to_email: 'arfatnaik800@gmail.com',
        critical_count: criticalDevices.length,
        device_list: this.formatDeviceList(criticalDevices),
        timestamp: new Date().toLocaleString(),
      };

      const response = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams,
        EMAILJS_CONFIG.publicKey
      );

      console.log('Email sent successfully via EmailJS:', response);
      return { success: true, method: 'emailjs' };
    } catch (error) {
      console.error('EmailJS error:', error);
      throw error;
    }
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
   * Send email using FormSubmit (another backup)
   */
  async sendViaFormSubmit(criticalDevices) {
    try {
      const form = new FormData();
      form.append('_to', 'arfatnaik800@gmail.com');
      form.append('_subject', `⚠️ Critical IoT Sensors Alert - ${criticalDevices.length} Devices`);
      form.append('_template', 'box');
      form.append('_captcha', 'false');
      form.append('message', this.formatEmailBody(criticalDevices));

      const response = await fetch('https://formsubmit.co/ajax/arfatnaik800@gmail.com', {
        method: 'POST',
        body: form,
      });

      const result = await response.json();
      if (result.success) {
        console.log('Email sent successfully via FormSubmit');
        return { success: true, method: 'formsubmit' };
      } else {
        throw new Error('FormSubmit failed');
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
      console.log('Email cooldown active. Skipping email.');
      return { success: true, skipped: true, reason: 'cooldown' };
    }

    console.log(`Sending alert for ${criticalDevices.length} critical devices...`);

    // Try methods in order of preference
    const methods = [
      () => this.sendViaWeb3Forms(criticalDevices),
      () => this.sendViaFormSubmit(criticalDevices),
      () => this.sendViaEmailJS(criticalDevices),
    ];

    for (const method of methods) {
      try {
        const result = await method();
        if (result.success) {
          this.lastEmailSent = Date.now();
          return result;
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
   - Maintenance Required: ${d.maintenance_required ? 'YES ⚠️' : 'NO'}`
      )
      .join('\n\n');
  }

  /**
   * Format full email body
   */
  formatEmailBody(devices) {
    const timestamp = new Date().toLocaleString();
    const totalDevices = devices.length;
    
    return `
⚠️ CRITICAL SENSORS ALERT ⚠️

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

This is an automated alert from the IoT Monitoring System.
`;
  }
}

export const emailService = new EmailService();
