# Email Notification System Setup Guide

## Overview
The IoT Dashboard now includes an automatic email notification system that sends alerts when critical sensors are detected. Emails are sent to `arfatnaik800@gmail.com` automatically.

## Features
- ✅ Automatic monitoring every 15 minutes
- ✅ Professional HTML email with critical sensor details
- ✅ Lists all devices exceeding warning thresholds (Current > 15A or Temperature > 30°C)
- ✅ Beautiful formatted table with device status
- ✅ Direct link to dashboard
- ✅ Actionable recommendations

## Email Configuration (Required for Production)

### Option 1: Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication**
   - Go to https://myaccount.google.com/security
   - Click "2-Step Verification" and follow the setup

2. **Generate App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "IoT Dashboard"
   - Click "Generate"
   - Copy the 16-character password

3. **Configure Environment Variables on Render**
   - Go to your backend service on Render
   - Navigate to "Environment" tab
   - Add these variables:
     ```
     SMTP_SERVER=smtp.gmail.com
     SMTP_PORT=587
     SENDER_EMAIL=your-gmail@gmail.com
     SENDER_PASSWORD=xxxx xxxx xxxx xxxx  (your App Password)
     RECIPIENT_EMAIL=arfatnaik800@gmail.com
     ```

### Option 2: Other Email Providers

#### SendGrid
```
SMTP_SERVER=smtp.sendgrid.net
SMTP_PORT=587
SENDER_EMAIL=apikey
SENDER_PASSWORD=your-sendgrid-api-key
RECIPIENT_EMAIL=arfatnaik800@gmail.com
```

#### Outlook/Hotmail
```
SMTP_SERVER=smtp-mail.outlook.com
SMTP_PORT=587
SENDER_EMAIL=your-email@outlook.com
SENDER_PASSWORD=your-password
RECIPIENT_EMAIL=arfatnaik800@gmail.com
```

## How It Works

### Automatic Monitoring
- The system checks for critical sensors every time device data is received
- Emails are sent **at most once every 15 minutes** to prevent spam
- Only sends email if there are critical sensors (Current > 15A OR Temperature > 30°C)

### Manual Triggers

#### 1. Check Critical Sensors Endpoint
```bash
curl -X POST https://iot-dashboard-09py.onrender.com/api/notifications/check-critical-sensors
```

Response:
```json
{
  "status": "success",
  "message": "Found 3 critical sensors",
  "critical_count": 3,
  "email_sent": true,
  "devices": ["IOT_001", "IOT_015", "IOT_042"]
}
```

#### 2. Test Email Configuration
```bash
curl -X POST https://iot-dashboard-09py.onrender.com/api/notifications/test-email
```

Response:
```json
{
  "status": "success",
  "message": "Test email sent",
  "email_sent": true
}
```

## Email Content

### What's Included
- 🔴 **Alert Header**: Shows number of critical sensors
- 📊 **Device Table**: Lists all critical devices with:
  - Device ID and Type
  - Current (Amps)
  - Temperature (°C)
  - Pressure (PSI)
  - Maintenance Status
- ⚡ **Threshold Information**: Warning and Critical limits
- 🔗 **Dashboard Link**: Direct access to view details
- 📝 **Recommended Actions**: What to do next

### Email Appearance
- Professional HTML design
- Color-coded status indicators (🔴 Critical, 🟡 Warning)
- Responsive layout
- Works in all email clients

## Testing

### Local Testing
1. Create a `.env` file in the `backend` folder:
```bash
cd backend
cp .env.example .env
```

2. Edit `.env` and add your email credentials

3. Start the backend:
```bash
python app.py
```

4. Test the email:
```bash
curl -X POST http://localhost:5001/api/notifications/test-email
```

### Production Testing (After Deployment)
```bash
# Test email configuration
curl -X POST https://iot-dashboard-09py.onrender.com/api/notifications/test-email

# Manually trigger critical sensor check
curl -X POST https://iot-dashboard-09py.onrender.com/api/notifications/check-critical-sensors
```

## Monitoring

### Check if Emails are Working
1. Look at backend logs on Render for messages like:
   ```
   INFO - Critical sensor email sent for 3 devices
   ```

2. If you see warnings like:
   ```
   WARNING - Email not configured - skipping email send
   ```
   Then the environment variables are not set up correctly.

### Common Issues

#### "Email not configured"
- **Cause**: SENDER_PASSWORD environment variable is empty
- **Fix**: Add the App Password to Render environment variables

#### "Authentication failed"
- **Cause**: Using regular Gmail password instead of App Password
- **Fix**: Generate and use App Password from https://myaccount.google.com/apppasswords

#### "SMTP timeout"
- **Cause**: Firewall or network restrictions
- **Fix**: Try using port 465 with SSL instead of 587 with TLS

## Customization

### Change Email Frequency
Edit `backend/routes/sensor_routes.py`:
```python
EMAIL_CHECK_INTERVAL = timedelta(minutes=30)  # Change from 15 to 30 minutes
```

### Change Critical Thresholds
Edit `backend/routes/sensor_routes.py`:
```python
critical_devices = [
    d for d in devices 
    if d.get('avg_current', 0) > 20  # Change from 15 to 20
    or d.get('avg_temperature', 0) > 35  # Change from 30 to 35
]
```

### Add More Recipients
Edit `backend/services/email_service.py`:
```python
self.recipient_email = 'email1@gmail.com,email2@gmail.com'  # Comma-separated
```

## Security Notes
- ⚠️ Never commit `.env` file with real credentials to Git
- ⚠️ Always use App Passwords, never regular passwords
- ⚠️ Store credentials as environment variables in production
- ⚠️ The `.env.example` file is safe to commit (no real credentials)

## Support
If emails are not working:
1. Check Render logs for error messages
2. Verify environment variables are set correctly
3. Test with the `/test-email` endpoint
4. Check your email spam folder
5. Verify 2FA and App Password are set up correctly

## Next Steps
1. ✅ Set up Gmail App Password
2. ✅ Add environment variables to Render
3. ✅ Test with `/test-email` endpoint
4. ✅ Start simulator and wait 15 minutes
5. ✅ Check arfatnaik800@gmail.com for alert email
