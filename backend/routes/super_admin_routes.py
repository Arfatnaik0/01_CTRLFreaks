"""
Super Admin Routes for Multi-Tenant Management
Handles tenant administration, user management, and system oversight
"""

from flask import Blueprint, request, jsonify, current_app
from flask_login import login_required, current_user
from models.tenant import TenantManager, TenantMiddleware
from models.database import get_db
import json
from datetime import datetime

super_admin_bp = Blueprint('super_admin', __name__)

def require_super_admin(f):
    """Decorator to require super admin access"""
    from functools import wraps
    
    @wraps(f)
    @login_required
    def decorated_function(*args, **kwargs):
        if not hasattr(current_user, 'role') or current_user.role != 'super_admin':
            return jsonify({'error': 'Super admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function

@super_admin_bp.route('/dashboard')
@require_super_admin
def super_admin_dashboard():
    """Get overview dashboard for super admin"""
    try:
        tenants = TenantManager.get_all_tenants()
        
        # Get statistics for each tenant
        tenant_stats = []
        for tenant in tenants:
            stats = TenantManager.get_tenant_statistics(tenant['id'])
            tenant_stats.append({
                'tenant': tenant,
                'stats': stats
            })
        
        # Overall system stats
        db = get_db()
        cursor = db.execute('SELECT COUNT(*) FROM users WHERE role != "super_admin"')
        total_users = cursor.fetchone()[0]
        
        cursor = db.execute('SELECT COUNT(DISTINCT device_id) FROM sensor_readings')
        total_devices = cursor.fetchone()[0] or 0
        
        cursor = db.execute('SELECT COUNT(*) FROM sensor_readings WHERE timestamp > datetime("now", "-24 hours")')
        total_recent_readings = cursor.fetchone()[0] or 0
        
        return jsonify({
            'status': 'success',
            'system_stats': {
                'total_tenants': len(tenants),
                'total_users': total_users,
                'total_devices': total_devices,
                'total_recent_readings': total_recent_readings
            },
            'tenant_stats': tenant_stats
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@super_admin_bp.route('/tenants')
@require_super_admin
def get_all_tenants():
    """Get all tenant information"""
    try:
        tenants = TenantManager.get_all_tenants()
        return jsonify({
            'status': 'success',
            'tenants': tenants
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@super_admin_bp.route('/tenant/<tenant_id>')
@require_super_admin
def get_tenant_details(tenant_id):
    """Get detailed information for a specific tenant"""
    try:
        db = get_db()
        
        # Get tenant info
        cursor = db.execute('SELECT * FROM tenants WHERE id = ?', (tenant_id,))
        tenant = cursor.fetchone()
        
        if not tenant:
            return jsonify({'error': 'Tenant not found'}), 404
        
        # Get tenant users
        cursor = db.execute('''
            SELECT id, username, email, role, is_active, created_at, last_login 
            FROM users WHERE tenant_id = ?
        ''', (tenant_id,))
        users = [dict(row) for row in cursor.fetchall()]
        
        # Get tenant statistics
        stats = TenantManager.get_tenant_statistics(tenant_id)
        
        # Get recent sensor readings
        cursor = db.execute('''
            SELECT device_id, AVG(current) as avg_current, AVG(temperature) as avg_temp, 
                   AVG(pressure) as avg_pressure, COUNT(*) as reading_count
            FROM sensor_readings 
            WHERE tenant_id = ? AND timestamp > datetime('now', '-24 hours')
            GROUP BY device_id
            ORDER BY reading_count DESC
            LIMIT 10
        ''', (tenant_id,))
        device_summary = [dict(row) for row in cursor.fetchall()]
        
        return jsonify({
            'status': 'success',
            'tenant': dict(tenant),
            'users': users,
            'statistics': stats,
            'device_summary': device_summary
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@super_admin_bp.route('/tenant/<tenant_id>/users')
@require_super_admin
def get_tenant_users(tenant_id):
    """Get all users for a specific tenant"""
    try:
        db = get_db()
        cursor = db.execute('''
            SELECT id, username, email, role, is_active, created_at, last_login
            FROM users WHERE tenant_id = ?
        ''', (tenant_id,))
        
        users = [dict(row) for row in cursor.fetchall()]
        
        return jsonify({
            'status': 'success',
            'tenant_id': tenant_id,
            'users': users
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@super_admin_bp.route('/tenant/<tenant_id>/activate', methods=['POST'])
@require_super_admin
def activate_tenant(tenant_id):
    """Activate or deactivate a tenant"""
    try:
        data = request.get_json()
        is_active = data.get('is_active', True)
        
        db = get_db()
        db.execute('UPDATE tenants SET is_active = ? WHERE id = ?', (is_active, tenant_id))
        db.commit()
        
        return jsonify({
            'status': 'success',
            'message': f'Tenant {tenant_id} {"activated" if is_active else "deactivated"}'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@super_admin_bp.route('/user/<int:user_id>/activate', methods=['POST'])
@require_super_admin
def activate_user(user_id):
    """Activate or deactivate a user"""
    try:
        data = request.get_json()
        is_active = data.get('is_active', True)
        
        db = get_db()
        db.execute('UPDATE users SET is_active = ? WHERE id = ?', (is_active, user_id))
        db.commit()
        
        return jsonify({
            'status': 'success',
            'message': f'User {"activated" if is_active else "deactivated"}'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@super_admin_bp.route('/system/stats')
@require_super_admin
def system_statistics():
    """Get comprehensive system statistics"""
    try:
        db = get_db()
        
        # User statistics
        cursor = db.execute('''
            SELECT role, COUNT(*) as count
            FROM users
            WHERE role != 'super_admin'
            GROUP BY role
        ''')
        user_stats = dict(cursor.fetchall())
        
        # Reading statistics by tenant
        cursor = db.execute('''
            SELECT tenant_id, COUNT(*) as reading_count,
                   AVG(current) as avg_current,
                   AVG(temperature) as avg_temperature,
                   AVG(pressure) as avg_pressure
            FROM sensor_readings
            WHERE timestamp > datetime('now', '-7 days')
            GROUP BY tenant_id
        ''')
        tenant_readings = [dict(row) for row in cursor.fetchall()]
        
        # Device activity
        cursor = db.execute('''
            SELECT tenant_id, COUNT(DISTINCT device_id) as device_count
            FROM sensor_readings
            WHERE timestamp > datetime('now', '-24 hours')
            GROUP BY tenant_id
        ''')
        device_activity = dict(cursor.fetchall())
        
        return jsonify({
            'status': 'success',
            'user_statistics': user_stats,
            'tenant_readings': tenant_readings,
            'device_activity': device_activity,
            'generated_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@super_admin_bp.route('/init-tenants', methods=['POST'])
@require_super_admin
def initialize_tenant_system():
    """Initialize or reinitialize the tenant system"""
    try:
        success = TenantManager.create_tenant_system()
        
        if success:
            return jsonify({
                'status': 'success',
                'message': 'Tenant system initialized successfully',
                'tenants_created': 4,
                'admin_credentials': {
                    'super_admin': 'superadmin / superadmin123',
                    'factory_admins': 'admin_a, admin_b, admin_c, admin_d / factory123'
                }
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to initialize tenant system'
            }), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500