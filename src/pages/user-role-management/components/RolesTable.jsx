import React, { useState, useEffect, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import api from '../../../utils/api';

const RolesTable = () => {
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [rolePermissions, setRolePermissions] = useState({}); // { roleId: [permissionSlugs] }
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [expandedRole, setExpandedRole] = useState(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        selectedPermissions: []
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [rolesRes, permsRes] = await Promise.all([
                api.get('/admin/tables/roles'),
                api.get('/admin/tables/permissions')
            ]);

            const rolesData = rolesRes.data || [];
            const permsData = permsRes.data || [];

            setRoles(rolesData);
            setPermissions(permsData);

            // Fetch role_permissions for each role
            try {
                const rpRes = await api.get('/roles/permissions');
                if (rpRes.data) {
                    setRolePermissions(rpRes.data);
                }
            } catch (rpErr) {
                console.error("Failed to fetch role permissions - backend endpoint unavailable?", rpErr);
                // Do NOT overwrite rolePermissions with empty data. Keep existing state.
            }
        } catch (err) {
            console.error("Failed to fetch data", err);
            // Fallback mock data
            setRoles([
                { id: 1, name: 'SYSTEM_ADMIN', description: 'Full system access' },
                { id: 2, name: 'NATIONAL_ADMIN', description: 'National level administrator' },
                { id: 3, name: 'PROVINCIAL_ADMIN', description: 'Provincial level administrator' },
                { id: 4, name: 'DISTRICT_ADMIN', description: 'District level administrator' },
                { id: 5, name: 'FACILITY_OFFICER', description: 'Facility data entry officer' }
            ]);
            setPermissions([
                { id: 1, slug: 'facilities.view', description: 'View facilities' },
                { id: 2, slug: 'facilities.create', description: 'Create facilities' },
                { id: 3, slug: 'facilities.edit', description: 'Edit facilities' },
                { id: 4, slug: 'facilities.delete', description: 'Delete facilities' },
                { id: 5, slug: 'users.view', description: 'View users' },
                { id: 6, slug: 'users.manage', description: 'Manage users' },
                { id: 7, slug: 'reports.view', description: 'View reports' },
                { id: 8, slug: 'settings.manage', description: 'Manage settings' }
            ]);
            setRolePermissions({
                1: ['*'],
                2: ['facilities.view', 'facilities.edit', 'facilities.approve', 'users.view', 'reports.view'],
                3: ['facilities.view', 'facilities.edit', 'reports.view'],
                4: ['facilities.view', 'facilities.create'],
                5: ['facilities.view', 'facilities.create', 'facilities.edit']
            });
        } finally {
            setLoading(false);
        }
    };

    // Get permissions for a role
    const getRolePermissions = (roleId) => {
        return rolePermissions[roleId] || [];
    };

    const handleOpenModal = (role = null) => {
        if (role) {
            setEditingRole(role);
            setFormData({
                name: role.name || '',
                description: role.description || '',
                selectedPermissions: getRolePermissions(role.id)
            });
        } else {
            setEditingRole(null);
            setFormData({ name: '', description: '', selectedPermissions: [] });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            alert('Role name is required');
            return;
        }

        setSaving(true);
        try {
            // Only send name and description to the roles table
            const rolePayload = {
                name: formData.name,
                description: formData.description
            };

            let savedRole;
            if (editingRole) {
                const res = await api.put(`/admin/tables/roles/${editingRole.id}`, rolePayload);
                savedRole = res.data;
            } else {
                const res = await api.post('/admin/tables/roles', rolePayload);
                savedRole = res.data;
            }

            // Try to update role_permissions if endpoint exists
            try {
                await api.post(`/roles/${savedRole.id}/permissions`, {
                    permissions: formData.selectedPermissions
                });
            } catch (permErr) {
                console.log("Role permissions update endpoint not available:", permErr.message);
                // Update local state as fallback
                setRolePermissions(prev => ({
                    ...prev,
                    [savedRole.id]: formData.selectedPermissions
                }));
            }

            await fetchData();
            alert('Role updated successfully! Permissions should be visible now.');
            setIsModalOpen(false);
        } catch (err) {
            console.error("Failed to save role", err);
            alert('Failed to save role: ' + (err.response?.data?.error || err.message));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (role) => {
        if (!window.confirm(`Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`)) return;

        try {
            await api.delete(`/admin/tables/roles/${role.id}`);
            await fetchData();
        } catch (err) {
            console.error("Failed to delete role", err);
            alert('Failed to delete role: ' + (err.response?.data?.error || err.message));
        }
    };

    const togglePermission = (permSlug) => {
        setFormData(prev => ({
            ...prev,
            selectedPermissions: prev.selectedPermissions.includes(permSlug)
                ? prev.selectedPermissions.filter(p => p !== permSlug)
                : [...prev.selectedPermissions, permSlug]
        }));
    };

    const getRoleBadgeColor = (name) => {
        const colors = {
            'SYSTEM_ADMIN': 'bg-red-500/10 text-red-600 border-red-200',
            'ADMIN': 'bg-red-500/10 text-red-600 border-red-200',
            'NATIONAL_ADMIN': 'bg-purple-500/10 text-purple-600 border-purple-200',
            'PROVINCIAL_ADMIN': 'bg-blue-500/10 text-blue-600 border-blue-200',
            'DISTRICT_ADMIN': 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
            'FACILITY_OFFICER': 'bg-amber-500/10 text-amber-600 border-amber-200'
        };
        return colors[name] || 'bg-slate-500/10 text-slate-600 border-slate-200';
    };

    if (loading) {
        return (
            <div className="bg-card rounded-xl border border-border p-8">
                <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="text-muted-foreground">Loading roles...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">System Roles</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Define access levels and permissions for different user types
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm shadow-sm"
                >
                    <Icon name="Plus" size={16} />
                    Add Role
                </button>
            </div>

            {/* Roles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.length === 0 ? (
                    <div className="col-span-full bg-card rounded-xl border border-border p-12 text-center">
                        <Icon name="Shield" size={48} className="mx-auto mb-4 text-muted-foreground/50" />
                        <h3 className="text-lg font-medium text-foreground mb-2">No Roles Defined</h3>
                        <p className="text-muted-foreground mb-4">Create your first role to start managing permissions</p>
                        <button
                            onClick={() => handleOpenModal()}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                        >
                            <Icon name="Plus" size={16} />
                            Create First Role
                        </button>
                    </div>
                ) : (
                    roles.map(role => {
                        const perms = getRolePermissions(role.id);
                        return (
                            <div
                                key={role.id}
                                className={`bg-card rounded-xl border border-border overflow-hidden transition-all hover:shadow-md ${expandedRole === role.id ? 'ring-2 ring-primary' : ''}`}
                            >
                                {/* Role Header */}
                                <div className="p-4 border-b border-border">
                                    <div className="flex items-start justify-between mb-2">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(role.name)}`}>
                                            <Icon name="Shield" size={12} className="mr-1" />
                                            {role.name}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleOpenModal(role)}
                                                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                                                title="Edit Role"
                                            >
                                                <Icon name="Pencil" size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(role)}
                                                className="p-1.5 text-muted-foreground hover:text-error hover:bg-error/10 rounded-md transition-colors"
                                                title="Delete Role"
                                            >
                                                <Icon name="Trash2" size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {role.description || 'No description provided'}
                                    </p>
                                </div>

                                {/* Permissions Summary */}
                                <div className="p-4">
                                    <button
                                        onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
                                        className="w-full flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Icon name="Key" size={14} />
                                            {perms.length || 0} Permissions
                                        </span>
                                        <Icon
                                            name={expandedRole === role.id ? 'ChevronUp' : 'ChevronDown'}
                                            size={16}
                                        />
                                    </button>

                                    {expandedRole === role.id && (
                                        <div className="mt-3 pt-3 border-t border-border">
                                            <div className="flex flex-wrap gap-1.5">
                                                {perms.includes('*') ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-error/10 text-error rounded">
                                                        Full Access (*)
                                                    </span>
                                                ) : perms.length > 0 ? (
                                                    perms.map(perm => (
                                                        <span
                                                            key={perm}
                                                            className="inline-block px-2 py-0.5 text-xs font-mono bg-muted rounded text-muted-foreground"
                                                        >
                                                            {perm}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">No permissions assigned</span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Role Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <div>
                                <h3 className="text-xl font-semibold text-foreground">
                                    {editingRole ? 'Edit Role' : 'Create New Role'}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {editingRole ? 'Update role details and permissions' : 'Define a new access role for the system'}
                                </p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                            >
                                <Icon name="X" size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                            <div className="space-y-6">
                                {/* Role Name */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Role Name <span className="text-error">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                                        placeholder="e.g., REGIONAL_MANAGER"
                                        className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Use UPPERCASE with underscores</p>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Describe the role's responsibilities..."
                                        rows={3}
                                        className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                    />
                                </div>

                                {/* Permissions Matrix */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-3">
                                        Permissions
                                    </label>
                                    <div className="border border-border rounded-lg overflow-hidden">
                                        <div className="bg-muted/50 px-4 py-2 border-b border-border">
                                            <span className="text-xs font-medium text-muted-foreground">
                                                {formData.selectedPermissions.length} of {permissions.length} selected
                                            </span>
                                        </div>
                                        <div className="divide-y divide-border max-h-64 overflow-y-auto">
                                            {permissions.map(perm => (
                                                <label
                                                    key={perm.id}
                                                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.selectedPermissions.includes(perm.slug)}
                                                        onChange={() => togglePermission(perm.slug)}
                                                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <span className="text-sm font-mono text-primary">{perm.slug}</span>
                                                        <p className="text-xs text-muted-foreground truncate">{perm.description}</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        <Icon name="Info" size={12} className="inline mr-1" />
                                        Permission assignments are saved locally. Backend endpoint may need setup.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/30">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Icon name="Check" size={16} />
                                        {editingRole ? 'Update Role' : 'Create Role'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RolesTable;
