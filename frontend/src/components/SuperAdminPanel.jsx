import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';

const SuperAdminPanel = () => {
    const [tenants, setTenants] = useState([]);
    const [systemStats, setSystemStats] = useState({});
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [tenantDetails, setTenantDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await fetch('/api/super-admin/dashboard', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch dashboard data');
            }
            
            const data = await response.json();
            setSystemStats(data.system_stats);
            setTenants(data.tenant_stats);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const fetchTenantDetails = async (tenantId) => {
        try {
            const response = await fetch(`/api/super-admin/tenant/${tenantId}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch tenant details');
            }
            
            const data = await response.json();
            setTenantDetails(data);
            setSelectedTenant(tenantId);
        } catch (err) {
            setError(err.message);
        }
    };

    const toggleTenantStatus = async (tenantId, currentStatus) => {
        try {
            const response = await fetch(`/api/super-admin/tenant/${tenantId}/activate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ is_active: !currentStatus })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update tenant status');
            }
            
            fetchDashboardData();
        } catch (err) {
            setError(err.message);
        }
    };

    const initializeTenantSystem = async () => {
        try {
            const response = await fetch('/api/super-admin/init-tenants', {
                method: 'POST',
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to initialize tenant system');
            }
            
            const data = await response.json();
            alert('Tenant system initialized successfully!\n\nCredentials:\n' + 
                  'Super Admin: superadmin / superadmin123\n' +
                  'Factory Admins: admin_a, admin_b, admin_c, admin_d / factory123');
            fetchDashboardData();
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 p-6">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <h2 className="font-bold">Error</h2>
                    <p>{error}</p>
                    <button 
                        onClick={fetchDashboardData}
                        className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Super Admin Dashboard
                    </h1>
                    <p className="text-gray-600">
                        Manage all factory tenants and monitor system-wide metrics
                    </p>
                </div>

                {/* System Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Tenants</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {systemStats.total_tenants || 0}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {systemStats.total_users || 0}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Devices</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {systemStats.total_devices || 0}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Recent Readings</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {systemStats.total_recent_readings || 0}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Actions */}
                <div className="mb-8">
                    <button
                        onClick={initializeTenantSystem}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Initialize/Reset Tenant System
                    </button>
                </div>

                {/* Tenants Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {tenants.map(({ tenant, stats }) => (
                        <Card key={tenant.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg">{tenant.name}</CardTitle>
                                        <p className="text-sm text-gray-600 mt-1">{tenant.description}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            tenant.is_active 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {tenant.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                        <button
                                            onClick={() => toggleTenantStatus(tenant.id, tenant.is_active)}
                                            className={`px-3 py-1 rounded text-xs ${
                                                tenant.is_active
                                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                                    : 'bg-green-600 text-white hover:bg-green-700'
                                            }`}
                                        >
                                            {tenant.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600">Users</p>
                                            <p className="font-semibold">{tenant.user_count || 0}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Devices</p>
                                            <p className="font-semibold">{stats.device_count || 0}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                                        <div>
                                            <p className="text-xs text-gray-600">Avg Current</p>
                                            <p className="text-sm font-medium">{stats.avg_current}A</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600">Avg Temp</p>
                                            <p className="text-sm font-medium">{stats.avg_temperature}°C</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-600">Avg Pressure</p>
                                            <p className="text-sm font-medium">{stats.avg_pressure} bar</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => fetchTenantDetails(tenant.id)}
                                        className="w-full mt-4 bg-gray-600 text-white py-2 rounded hover:bg-gray-700 transition-colors"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Tenant Details Modal */}
                {selectedTenant && tenantDetails && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-4xl w-full max-h-96 overflow-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-xl font-bold">
                                        {tenantDetails.tenant.name} - Details
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setSelectedTenant(null);
                                            setTenantDetails(null);
                                        }}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Users */}
                                    <div>
                                        <h3 className="font-semibold mb-3">Users ({tenantDetails.users.length})</h3>
                                        <div className="space-y-2">
                                            {tenantDetails.users.map(user => (
                                                <div key={user.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                    <div>
                                                        <p className="font-medium">{user.username}</p>
                                                        <p className="text-sm text-gray-600">{user.role}</p>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded text-xs ${
                                                        user.is_active 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {user.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Device Summary */}
                                    <div>
                                        <h3 className="font-semibold mb-3">Devices</h3>
                                        <div className="space-y-2">
                                            {tenantDetails.device_summary.slice(0, 5).map(device => (
                                                <div key={device.device_id} className="p-2 bg-gray-50 rounded">
                                                    <p className="font-medium">{device.device_id}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {device.reading_count} readings
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuperAdminPanel;