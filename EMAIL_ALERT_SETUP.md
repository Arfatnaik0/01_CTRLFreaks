# Email Alert System Setup Guide

## Overview
The email alert system automatically sends notifications to `arfatnaik800@gmail.com` when critical IoT sensors are detected.

## Current Configuration
✅ **Already configured and ready to use!**

The system uses **Web3Forms** - a free email service that requires no signup or configuration.

## How It Works

### 1. Automatic Detection
- Every 5 seconds, the dashboard checks for critical devices
- Critical threshold: Current > 20A OR Temperature > 35°C
- Maintenance required devices are also flagged

### 2. Email Cooldown
- Emails are sent at most once every 5 minutes
- This prevents email spam if multiple devices become critical

### 3. Email Content
The email includes:
- Total count of critical devices
- Device ID and type
- Current readings (Current, Temperature, Pressure)
- Status and maintenance flags
- Timestamp
- Link to dashboard

## Email Service Options

### Option 1: Web3Forms (Currently Active) ✅
**Status:** Ready to use, no setup needed!

**Pros:**
- No signup required
- Unlimited emails
- Works immediately
- No API key needed

**Cons:**
- Basic formatting

### Option 2: EmailJS (Optional Upgrade)
If you want better email templates:

1. Go to https://www.emailjs.com/
2. Sign up for free account (200 emails/month)
3. Create a new service (Gmail recommended)
4. Create an email template with these variables:
   - `{{to_email}}`
   - `{{critical_count}}`
   - `{{device_list}}`
   - `{{timestamp}}`
5. Get your Public Key, Service ID, and Template ID
6. Update `frontend/src/services/emailService.js`:
   ```javascript
   const EMAILJS_CONFIG = {
     serviceId: 'service_YOUR_ID',
     templateId: 'template_YOUR_ID',
     publicKey: 'YOUR_PUBLIC_KEY',
   };
   ```
7. Set `this.useEmailJS = true;` in the constructor
8. Install EmailJS: `cd frontend && npm install @emailjs/browser`

### Option 3: FormSubmit (Backup)
Automatically activates if Web3Forms fails.

## Testing the Email System

### Test Locally:
1. Start the simulator with high values to trigger critical alerts:
   ```bash
   cd simulator
   python device_simulator.py --devices 10
   ```

2. Open the dashboard in your browser
3. Wait for critical devices to appear (red cards)
4. Check console for: "Sending alert for X critical devices..."
5. Check email at arfatnaik800@gmail.com

### Expected Behavior:
- ✅ Green notification appears: "Alert email sent for X critical device(s)"
- ✅ Email received within 1-2 minutes
- ✅ No more emails for 5 minutes (cooldown)

## Email Format Example

```
⚠️ CRITICAL SENSORS ALERT ⚠️

Timestamp: 10/26/2025, 3:30:45 PM
Critical Devices Count: 3

The following IoT sensors have exceeded critical thresholds and require immediate maintenance:

1. IOT_015 (motor)
   - Current: 23.45A 🔴 CRITICAL
   - Temperature: 32.10°C ⚠️
   - Status: online
   - Maintenance Required: YES ⚠️

2. IOT_027 (compressor)
   - Current: 18.20A ⚠️
   - Temperature: 37.80°C 🔴 CRITICAL
   - Status: online
   - Maintenance Required: YES ⚠️

...

---
Thresholds:
• Critical Current: > 20A
• Critical Temperature: > 35°C
• Warning Current: > 15A
• Warning Temperature: > 30°C

Please check the dashboard for real-time updates:
https://iot-frontend-gmny.onrender.com/

This is an automated alert from the IoT Monitoring System.
```

## Troubleshooting

### No emails received?
1. Check browser console for errors
2. Verify email status indicator appears in dashboard
3. Check spam folder
4. Wait 5 minutes (cooldown period)
5. Try refreshing the page

### Emails not sending?
- Web3Forms has no limits, so it should always work
- Check internet connection
- Check browser console for "Email sent successfully via Web3Forms"

### Want to change email recipient?
Edit `frontend/src/services/emailService.js`:
```javascript
to: 'your-new-email@gmail.com',  // Change this
```

## Customization

### Change email cooldown period:
```javascript
this.emailCooldown = 10 * 60 * 1000; // 10 minutes instead of 5
```

### Change critical thresholds:
In `Dashboard.jsx`, modify the `checkAndSendCriticalAlert` function:
```javascript
return avgCurrent > 25 || avgTemp > 40; // Higher thresholds
```

### Add more email services:
Add to the `methods` array in `sendCriticalAlert()`:
```javascript
const methods = [
  () => this.sendViaWeb3Forms(criticalDevices),
  () => this.sendViaYourNewService(criticalDevices),
  // ...
];
```

## Files Modified
- `frontend/src/services/emailService.js` - Email service logic
- `frontend/src/components/Dashboard.jsx` - Integration and UI
- Dashboard now shows green notification when email sent

## Production Deployment
Already deployed! The system is live at:
- Frontend: https://iot-frontend-gmny.onrender.com/
- No backend changes needed (frontend-only solution)

The email system will start working immediately once deployed.
