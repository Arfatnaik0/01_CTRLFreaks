"""
Email notification service for IoT alerts
Sends email notifications for critical sensors and maintenance alerts
"""

import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import os

logger = logging.getLogger(__name__)

class EmailService:
    """Email service for sending notifications"""
    
    def __init__(self):
        # Use environment variables for email configuration
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.sender_email = os.getenv('SENDER_EMAIL', 'noreply@iotdashboard.com')
        self.sender_password = os.getenv('SENDER_PASSWORD', '')
        self.recipient_email = os.getenv('RECIPIENT_EMAIL', 'arfatnaik800@gmail.com')
        
    def send_critical_sensor_alert(self, critical_devices):
        """Send email alert for critical sensors that need maintenance"""
        try:
            if not critical_devices:
                logger.info("No critical devices to report")
                return True
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f'🚨 IoT Dashboard Alert: {len(critical_devices)} Critical Sensors Detected'
            msg['From'] = self.sender_email
            msg['To'] = self.recipient_email
            
            # Create HTML content
            html_content = self._create_html_alert(critical_devices)
            text_content = self._create_text_alert(critical_devices)
            
            # Attach both plain text and HTML versions
            part1 = MIMEText(text_content, 'plain')
            part2 = MIMEText(html_content, 'html')
            msg.attach(part1)
            msg.attach(part2)
            
            # Send email
            if self.sender_password:  # Only try to send if password is configured
                with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.sender_email, self.sender_password)
                    server.send_message(msg)
                
                logger.info(f"Critical sensor alert email sent to {self.recipient_email}")
                return True
            else:
                logger.warning("Email not configured - skipping email send")
                logger.info(f"Would have sent alert for {len(critical_devices)} critical devices")
                return False
                
        except Exception as e:
            logger.error(f"Failed to send email alert: {e}")
            return False
    
    def _create_html_alert(self, critical_devices):
        """Create HTML formatted email content"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Build device table rows
        device_rows = ""
        for device in critical_devices:
            status_icon = "🔴" if device.get('avg_current', 0) > 20 or device.get('avg_temperature', 0) > 35 else "🟡"
            device_rows += f"""
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px 8px;">{status_icon} {device['device_id']}</td>
                <td style="padding: 12px 8px;">{device.get('device_type', 'Unknown')}</td>
                <td style="padding: 12px 8px; color: #dc2626; font-weight: 600;">
                    {device.get('avg_current', 0):.2f}A
                </td>
                <td style="padding: 12px 8px; color: #dc2626; font-weight: 600;">
                    {device.get('avg_temperature', 0):.2f}°C
                </td>
                <td style="padding: 12px 8px;">{device.get('avg_pressure', 0):.2f} PSI</td>
                <td style="padding: 12px 8px;">
                    {'⚠️ Maintenance Required' if device.get('maintenance_required') else 'Monitor'}
                </td>
            </tr>
            """
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }}
                .container {{ max-width: 800px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); 
                           color: white; padding: 30px; border-radius: 8px 8px 0 0; }}
                .content {{ background: white; padding: 30px; border: 1px solid #e5e7eb; 
                           border-top: none; border-radius: 0 0 8px 8px; }}
                .alert-box {{ background: #fef2f2; border-left: 4px solid #dc2626; 
                             padding: 16px; margin: 20px 0; border-radius: 4px; }}
                table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                th {{ background: #f9fafb; padding: 12px 8px; text-align: left; 
                      font-weight: 600; border-bottom: 2px solid #e5e7eb; }}
                .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }}
                .button {{ display: inline-block; background: #2563eb; color: white; 
                          padding: 12px 24px; text-decoration: none; border-radius: 6px; 
                          margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0; font-size: 24px;">🚨 Critical Sensor Alert</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.9;">IoT Dashboard Monitoring System</p>
                </div>
                
                <div class="content">
                    <div class="alert-box">
                        <strong style="color: #dc2626; font-size: 16px;">⚠️ Attention Required</strong>
                        <p style="margin: 8px 0 0 0; color: #374151;">
                            {len(critical_devices)} sensor(s) are currently in critical state and require immediate attention.
                        </p>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px;">
                        Alert Generated: {timestamp}
                    </p>
                    
                    <h2 style="color: #111827; font-size: 18px; margin-top: 24px;">Critical Sensors Detected</h2>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>Device ID</th>
                                <th>Type</th>
                                <th>Current</th>
                                <th>Temperature</th>
                                <th>Pressure</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {device_rows}
                        </tbody>
                    </table>
                    
                    <div style="background: #f9fafb; padding: 16px; border-radius: 6px; margin: 20px 0;">
                        <h3 style="margin: 0 0 8px 0; color: #111827; font-size: 16px;">⚡ Threshold Warnings:</h3>
                        <ul style="margin: 0; padding-left: 20px; color: #374151;">
                            <li><strong>Warning:</strong> Current > 15A or Temperature > 30°C</li>
                            <li><strong>Critical:</strong> Current > 20A or Temperature > 35°C</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="https://iot-frontend-gmny.onrender.com/" class="button">
                            View Dashboard →
                        </a>
                    </div>
                    
                    <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
                        <strong>Recommended Actions:</strong><br>
                        1. Check the affected devices immediately<br>
                        2. Schedule maintenance for devices marked with ⚠️<br>
                        3. Monitor trending data for potential issues
                    </p>
                </div>
                
                <div class="footer">
                    <p>This is an automated alert from your IoT Dashboard Monitoring System</p>
                    <p style="font-size: 12px; color: #9ca3af;">
                        © 2025 IoT Dashboard | Automated Alert System
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        return html
    
    def _create_text_alert(self, critical_devices):
        """Create plain text email content"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        text = f"""
IoT Dashboard - Critical Sensor Alert
{'='*60}

ATTENTION REQUIRED: {len(critical_devices)} sensor(s) in critical state

Alert Generated: {timestamp}

CRITICAL SENSORS:
{'-'*60}
"""
        
        for device in critical_devices:
            text += f"""
Device ID: {device['device_id']}
Type: {device.get('device_type', 'Unknown')}
Current: {device.get('avg_current', 0):.2f}A (Warning: >15A, Critical: >20A)
Temperature: {device.get('avg_temperature', 0):.2f}°C (Warning: >30°C, Critical: >35°C)
Pressure: {device.get('avg_pressure', 0):.2f} PSI
Status: {'⚠️ MAINTENANCE REQUIRED' if device.get('maintenance_required') else 'Monitor'}
{'-'*60}
"""
        
        text += f"""

RECOMMENDED ACTIONS:
1. Check the affected devices immediately
2. Schedule maintenance for devices requiring attention
3. Monitor trending data for potential issues

View Dashboard: https://iot-frontend-gmny.onrender.com/

---
This is an automated alert from your IoT Dashboard Monitoring System
© 2025 IoT Dashboard
"""
        return text


# Global email service instance
email_service = EmailService()
