# Multi-Tenant IoT Control Center

## Overview

The IoT Control Center now supports multi-tenant architecture, allowing multiple factories to use the same system with isolated data and separate admin panels.

## Multi-Tenant Features

### 🏭 Factory Isolation
- **4 Pre-configured Factories**: factory_a, factory_b, factory_c, factory_d
- **Data Isolation**: Each factory's sensor data, devices, and users are completely isolated
- **Tenant-Specific Dashboards**: Each factory sees only their own data

### 👥 User Management
- **Super Admin**: System-wide oversight and management
- **Factory Admins**: Manage individual factory operations
- **Role-Based Access**: Different permissions based on user roles

### 🔐 Authentication & Authorization
- **Tenant-Based Login**: Users are associated with specific factories
- **Super Admin Panel**: Separate interface for system administration
- **Secure Isolation**: No cross-tenant data access

## Default Credentials

### Super Admin
- **Username**: `superadmin`
- **Password**: `superadmin123`
- **Access**: Full system oversight, can view all factories

### Factory Admins
- **Factory A**: `admin_a` / `factory123`
- **Factory B**: `admin_b` / `factory123`
- **Factory C**: `admin_c` / `factory123`
- **Factory D**: `admin_d` / `factory123`

### Legacy Admin (Backward Compatibility)
- **Username**: `admin`
- **Password**: `admin`
- **Tenant**: Assigned to factory_a by default

## Quick Start Guide

### 1. Deploy & Initialize
```bash
# The system auto-initializes on deployment
# Or manually initialize:
curl -X GET https://your-backend-url.com/api/init-db
```

### 2. Access Super Admin Panel
1. Login as `superadmin` / `superadmin123`
2. Navigate to **Super Admin** tab in the header
3. View system overview and manage all factories

### 3. Access Factory Dashboards
1. Login with factory-specific credentials (e.g., `admin_a` / `factory123`)
2. View factory-specific dashboard with isolated data

### 4. Run Multi-Tenant Simulators
```bash
# Simulate Factory A devices
python simulator/device_simulator.py --tenant factory_a --devices 50

# Simulate Factory B devices  
python simulator/device_simulator.py --tenant factory_b --devices 75

# Simulate Factory C devices
python simulator/device_simulator.py --tenant factory_c --devices 100

# Simulate Factory D devices
python simulator/device_simulator.py --tenant factory_d --devices 60
```

## Architecture Changes

### Database Schema
```sql
-- New tenants table
CREATE TABLE tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    admin_email TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    settings TEXT DEFAULT '{}'
);

-- Updated users table with tenant isolation
ALTER TABLE users ADD COLUMN tenant_id TEXT DEFAULT 'default';

-- Updated sensor_readings with tenant isolation  
ALTER TABLE sensor_readings ADD COLUMN tenant_id TEXT DEFAULT 'default';

-- Updated device_status with tenant isolation
ALTER TABLE device_status ADD COLUMN tenant_id TEXT DEFAULT 'default';
```

### API Changes
- **Tenant-Aware Endpoints**: All data endpoints now filter by tenant_id
- **Super Admin Routes**: New `/api/super-admin/*` endpoints
- **Tenant Management**: Create, activate/deactivate tenants
- **Cross-Tenant Analytics**: Super admin can view aggregated data

### Frontend Updates
- **Navigation**: Dynamic navigation based on user role
- **Super Admin Panel**: New comprehensive management interface
- **Tenant Context**: All components respect tenant boundaries
- **Role-Based UI**: Different interfaces for different user types

## Super Admin Capabilities

### System Overview
- **Total Statistics**: Users, devices, readings across all tenants
- **Tenant Status**: Monitor all factory operations
- **System Health**: Overall system performance metrics

### Tenant Management
- **Activate/Deactivate**: Enable or disable entire factories
- **User Management**: View and manage users per factory
- **Resource Monitoring**: Track usage per factory
- **Configuration**: Tenant-specific settings

### Analytics & Reporting
- **Cross-Tenant Analytics**: Compare performance across factories
- **System-Wide Metrics**: Overall system health and usage
- **Tenant Isolation Verification**: Ensure data separation

## Developer Notes

### Adding New Tenants
1. **Database**: Insert new tenant in `tenants` table
2. **Users**: Create admin user for new tenant
3. **Simulator**: Add new tenant_id to simulator options
4. **Frontend**: Tenant automatically appears in Super Admin panel

### Tenant Isolation Implementation
- **Middleware**: `TenantMiddleware` handles automatic filtering
- **Database Queries**: All queries include `WHERE tenant_id = ?`
- **API Routes**: Tenant context from user session
- **Data Validation**: Prevent cross-tenant data access

### Security Considerations
- **Session Management**: Tenant_id stored in secure session
- **API Authorization**: Every endpoint validates tenant access
- **Super Admin Protection**: Role verification on sensitive operations
- **Data Isolation**: Database-level tenant separation

## Troubleshooting

### Common Issues

#### Factory Not Showing Data
1. Check simulator is running with correct `--tenant` flag
2. Verify user is logged in with correct factory credentials
3. Confirm tenant is active in Super Admin panel

#### Super Admin Panel Not Accessible
1. Ensure login as `superadmin` user
2. Check user role is `super_admin` in database
3. Verify Super Admin routes are registered

#### Cross-Tenant Data Leakage
1. All queries must include tenant_id filter
2. Check middleware is properly applied
3. Verify session management includes tenant context

### Monitoring
- **Logs**: Check backend logs for tenant-specific operations
- **Database**: Query tenants table for active factories
- **API Health**: Use `/api/health` endpoint for system status

## Migration from Single-Tenant

### Existing Data
- **Legacy Users**: Automatically assigned to `factory_a`
- **Historical Data**: Existing readings assigned to `factory_a`
- **Backward Compatibility**: Old admin credentials still work

### Upgrade Steps
1. **Deploy New Version**: Multi-tenant system auto-initializes
2. **Create Factory Admins**: New credentials for each factory
3. **Configure Simulators**: Add `--tenant` flags to existing simulators
4. **Test Isolation**: Verify each factory sees only their data

## Future Enhancements

### Planned Features
- **Custom Tenant Branding**: Factory-specific themes and logos
- **Tenant-Specific Analytics**: Advanced per-factory reporting
- **Resource Quotas**: Limits on devices/users per tenant
- **Tenant Self-Service**: Factory admins can manage their settings
- **Multi-Region Support**: Geographic distribution of tenants
- **Advanced Billing**: Usage-based pricing per factory

### API Extensions
- **Tenant APIs**: RESTful tenant management endpoints
- **Bulk Operations**: Mass user/device management per tenant
- **Export/Import**: Tenant data migration capabilities
- **Webhooks**: Tenant-specific event notifications

---

**Note**: This multi-tenant architecture provides complete data isolation while maintaining a unified system management interface. Each factory operates independently while the super admin maintains oversight of the entire system.