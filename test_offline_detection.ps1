# IoT Offline Detection Test Script
# This script tests the automatic offline detection feature

$BackendURL = "https://iot-dashboard-09py.onrender.com"

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  IoT Offline Detection Test" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Function to check system status
function Get-SystemStatus {
    try {
        $response = Invoke-WebRequest -Uri "$BackendURL/api/system-status" -UseBasicParsing | ConvertFrom-Json
        Write-Host "System Status:" -ForegroundColor Yellow
        Write-Host "  System Online: $($response.system_online)" -ForegroundColor $(if($response.system_online){"Green"}else{"Red"})
        Write-Host "  Total Devices: $($response.total_devices)"
        Write-Host "  Online Devices: $($response.online_devices)" -ForegroundColor Green
        Write-Host "  Offline Devices: $($response.offline_devices)" -ForegroundColor Gray
        Write-Host ""
        return $response
    } catch {
        Write-Host "Error checking status: $_" -ForegroundColor Red
        return $null
    }
}

# Function to clear all devices
function Clear-AllDevices {
    Write-Host "Clearing all device data..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "$BackendURL/api/clear-all-devices" -Method POST -UseBasicParsing | ConvertFrom-Json
        Write-Host "  Devices deleted: $($response.devices_deleted)" -ForegroundColor Green
        Write-Host "  Readings deleted: $($response.readings_deleted)" -ForegroundColor Green
        Write-Host ""
        return $response
    } catch {
        Write-Host "Error clearing devices: $_" -ForegroundColor Red
        return $null
    }
}

# Function to clear offline devices only
function Clear-OfflineDevices {
    Write-Host "Clearing offline devices (>30s)..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "$BackendURL/api/clear-offline-devices" -Method POST -UseBasicParsing | ConvertFrom-Json
        Write-Host "  Devices deleted: $($response.deleted_count)" -ForegroundColor Green
        Write-Host ""
        return $response
    } catch {
        Write-Host "Error clearing offline devices: $_" -ForegroundColor Red
        return $null
    }
}

# Main test flow
Write-Host "Step 1: Check current system status" -ForegroundColor Cyan
$status = Get-SystemStatus

if ($status.total_devices -gt 0) {
    Write-Host "Step 2: Found $($status.total_devices) devices" -ForegroundColor Yellow
    Write-Host ""
    
    $choice = Read-Host "Do you want to (C)lear all devices or (O)nly offline ones? [C/O]"
    
    if ($choice -eq "C" -or $choice -eq "c") {
        Clear-AllDevices
    } elseif ($choice -eq "O" -or $choice -eq "o") {
        Clear-OfflineDevices
    } else {
        Write-Host "Invalid choice. Exiting." -ForegroundColor Red
        exit
    }
    
    Write-Host "Step 3: Verify devices cleared" -ForegroundColor Cyan
    Start-Sleep -Seconds 2
    $status = Get-SystemStatus
    
    if ($status.total_devices -eq 0) {
        Write-Host "SUCCESS! All devices cleared." -ForegroundColor Green
        Write-Host ""
        Write-Host "Now refresh your dashboard (Ctrl+Shift+R)" -ForegroundColor Yellow
        Write-Host "You should see the empty state!" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Still showing $($status.total_devices) devices" -ForegroundColor Yellow
    }
} else {
    Write-Host "No devices found. System is clean!" -ForegroundColor Green
}

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  Test Complete!" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
