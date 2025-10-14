"""
Multi-tenant system for IoT Control Center
Supports multiple factories with isolated data
"""

import bcrypt
import json
from datetime import datetime
from flask import g, current_app
from .database import get_db

class TenantManager:
    """Manages multi-tenant functionality"""
    
    @staticmethod
    def create_tenant_system():
        """Initialize multi-tenant system with 4 factories"""
        db = get_db()
        
        try:
            # Create tenants table if not exists
            db.execute('''
                CREATE TABLE IF NOT EXISTS tenants (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    admin_email TEXT,
                    is_active BOOLEAN NOT NULL DEFAULT 1,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    settings TEXT DEFAULT '{}'
                )
            ''')
            
            # Add tenant_id to existing tables if not exists
            try:
                db.execute('ALTER TABLE users ADD COLUMN tenant_id TEXT DEFAULT "default"')
            except:
                pass  # Column might already exist
                
            try:
                db.execute('ALTER TABLE sensor_readings ADD COLUMN tenant_id TEXT DEFAULT "default"')
            except:
                pass
                
            try:
                db.execute('ALTER TABLE device_status ADD COLUMN tenant_id TEXT DEFAULT "default"')
            except:
                pass
            
            # Check if tenants already exist
            cursor = db.execute('SELECT COUNT(*) FROM tenants')
            tenant_count = cursor.fetchone()[0]
            
            if tenant_count == 0:
                # Create super admin
                super_admin_hash = bcrypt.hashpw('superadmin123'.encode('utf-8'), bcrypt.gensalt())
                db.execute('''
                    INSERT INTO users (username, email, password_hash, role, tenant_id, is_active, created_at)
                    VALUES (?, ?, ?, ?, ?, 1, datetime('now'))
                ''', ('superadmin', 'superadmin@iot-control.com', super_admin_hash, 'super_admin', 'system'))
                
                # Create factory tenants and admins
                factories = [
                    {'id': 'factory_a', 'name': 'Manufacturing Plant A', 'admin': 'admin_a', 'email': 'admin_a@factory-a.com'},
                    {'id': 'factory_b', 'name': 'Manufacturing Plant B', 'admin': 'admin_b', 'email': 'admin_b@factory-b.com'},
                    {'id': 'factory_c', 'name': 'Manufacturing Plant C', 'admin': 'admin_c', 'email': 'admin_c@factory-c.com'},
                    {'id': 'factory_d', 'name': 'Manufacturing Plant D', 'admin': 'admin_d', 'email': 'admin_d@factory-d.com'}
                ]
                
                for factory in factories:
                    # Create tenant
                    db.execute('''
                        INSERT INTO tenants (id, name, description, admin_email, is_active, created_at)
                        VALUES (?, ?, ?, ?, 1, datetime('now'))
                    ''', (factory['id'], factory['name'], f"IoT Control for {factory['name']}", factory['email']))
                    
                    # Create factory admin
                    admin_hash = bcrypt.hashpw('factory123'.encode('utf-8'), bcrypt.gensalt())
                    db.execute('''
                        INSERT INTO users (username, email, password_hash, role, tenant_id, is_active, created_at)
                        VALUES (?, ?, ?, ?, ?, 1, datetime('now'))
                    ''', (factory['admin'], factory['email'], admin_hash, 'admin', factory['id']))
                
                db.commit()
                return True
                
        except Exception as e:
            print(f"Error creating tenant system: {e}")
            return False
    
    @staticmethod
    def get_user_tenant(user_id):
        """Get tenant information for a user"""
        db = get_db()
        cursor = db.execute('''
            SELECT u.tenant_id, t.name, t.description
            FROM users u
            LEFT JOIN tenants t ON u.tenant_id = t.id
            WHERE u.id = ?
        ''', (user_id,))
        
        result = cursor.fetchone()
        return dict(result) if result else None
    
    @staticmethod
    def get_all_tenants():
        """Get all tenants for super admin"""
        db = get_db()
        cursor = db.execute('''
            SELECT t.*, COUNT(u.id) as user_count,
                   COUNT(CASE WHEN u.last_login IS NOT NULL THEN 1 END) as active_users
            FROM tenants t
            LEFT JOIN users u ON t.id = u.tenant_id AND u.role != 'super_admin'
            WHERE t.is_active = 1
            GROUP BY t.id
            ORDER BY t.name
        ''')
        
        return [dict(row) for row in cursor.fetchall()]
    
    @staticmethod
    def get_tenant_statistics(tenant_id):
        """Get statistics for a specific tenant"""
        db = get_db()
        
        # Device count
        cursor = db.execute('SELECT COUNT(DISTINCT device_id) FROM sensor_readings WHERE tenant_id = ?', (tenant_id,))
        device_count = cursor.fetchone()[0] or 0
        
        # Reading count (last 24 hours)
        cursor = db.execute('''
            SELECT COUNT(*) FROM sensor_readings 
            WHERE tenant_id = ? AND timestamp > datetime('now', '-24 hours')
        ''', (tenant_id,))
        recent_readings = cursor.fetchone()[0] or 0
        
        # Average values
        cursor = db.execute('''
            SELECT AVG(current) as avg_current, AVG(temperature) as avg_temp, AVG(pressure) as avg_pressure
            FROM sensor_readings 
            WHERE tenant_id = ? AND timestamp > datetime('now', '-24 hours')
        ''', (tenant_id,))
        
        averages = cursor.fetchone()
        
        return {
            'tenant_id': tenant_id,
            'device_count': device_count,
            'recent_readings': recent_readings,
            'avg_current': round(averages[0] or 0, 2),
            'avg_temperature': round(averages[1] or 0, 2),
            'avg_pressure': round(averages[2] or 0, 2)
        }


class TenantMiddleware:
    """Middleware to handle tenant isolation"""
    
    @staticmethod
    def get_current_tenant():
        """Get current user's tenant from session"""
        if hasattr(g, 'current_user') and g.current_user:
            return getattr(g.current_user, 'tenant_id', 'default')
        return 'default'
    
    @staticmethod
    def filter_by_tenant(query_result, tenant_id=None):
        """Filter query results by tenant"""
        if tenant_id is None:
            tenant_id = TenantMiddleware.get_current_tenant()
        
        if isinstance(query_result, list):
            return [item for item in query_result if item.get('tenant_id') == tenant_id]
        
        return query_result
    
    @staticmethod
    def add_tenant_to_data(data, tenant_id=None):
        """Add tenant_id to data before storing"""
        if tenant_id is None:
            tenant_id = TenantMiddleware.get_current_tenant()
        
        if isinstance(data, dict):
            data['tenant_id'] = tenant_id
        elif isinstance(data, list):
            for item in data:
                if isinstance(item, dict):
                    item['tenant_id'] = tenant_id
        
        return data