import React, { useState, useEffect, useMemo } from 'react';
import Icon from '../../../components/AppIcon';
import api from '../../../utils/api';

const PermissionsTable = () => {
    const [permissions, setPermissions] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [permsRes, rolesRes] = await Promise.all([
                api.get('/admin/tables/permissions'),
                api.get('/admin/tables/roles')
            ]);
            setPermissions(permsRes.data || []);
            setRoles(rolesRes.data || []);
        } catch (err) {
            console.error("Failed to fetch data", err);
            // Fallback mock data
            setPermissions([
                { id: 1, slug: 'facilities.view', description: 'View facility records', category: 'Facilities' },
                { id: 2, slug: 'facilities.create', description: 'Create new facilities', category: 'Facilities' },
                { id: 3, slug: 'facilities.edit', description: 'Edit existing facilities', category: 'Facilities' },
                { id: 4, slug: 'facilities.delete', description: 'Delete facilities', category: 'Facilities' },
                { id: 5, slug: 'facilities.approve', description: 'Approve facility submissions', category: 'Facilities' },
                { id: 6, slug: 'users.view', description: 'View user accounts', category: 'Users' },
                { id: 7, slug: 'users.create', description: 'Create new users', category: 'Users' },
                { id: 8, slug: 'users.edit', description: 'Edit user details', category: 'Users' },
                { id: 9, slug: 'users.delete', description: 'Delete user accounts', category: 'Users' },
                { id: 10, slug: 'reports.view', description: 'View system reports', category: 'Reports' },
                { id: 11, slug: 'reports.export', description: 'Export reports to file', category: 'Reports' },
                { id: 12, slug: 'settings.view', description: 'View system settings', category: 'Settings' },
                { id: 13, slug: 'settings.manage', description: 'Modify system settings', category: 'Settings' },
                { id: 14, slug: 'audit.view', description: 'View audit logs', category: 'Audit' },
                { id: 15, slug: 'workflow.manage', description: 'Manage workflows', category: 'Workflow' }
            ]);
            setRoles([
                { id: 1, name: 'SYSTEM_ADMIN', permissions: ['*'] },
                { id: 2, name: 'NATIONAL_ADMIN', permissions: ['facilities.view', 'facilities.edit', 'facilities.approve', 'users.view', 'reports.view'] },
                { id: 3, name: 'PROVINCIAL_ADMIN', permissions: ['facilities.view', 'facilities.edit', 'reports.view'] },
                { id: 4, name: 'DISTRICT_ADMIN', permissions: ['facilities.view', 'facilities.create'] },
                { id: 5, name: 'FACILITY_OFFICER', permissions: ['facilities.view', 'facilities.create', 'facilities.edit'] }
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Extract categories from permissions
    const categories = useMemo(() => {
        const cats = new Set(permissions.map(p => p.category || p.slug.split('.')[0]));
        return ['all', ...Array.from(cats)];
    }, [permissions]);

    // Filter permissions
    const filteredPermissions = useMemo(() => {
        return permissions.filter(p => {
            const matchesSearch = searchQuery === '' ||
                p.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description?.toLowerCase().includes(searchQuery.toLowerCase());
            const cat = p.category || p.slug.split('.')[0];
            const matchesCategory = selectedCategory === 'all' || cat === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [permissions, searchQuery, selectedCategory]);

    // Check if a role has a permission
    const roleHasPermission = (role, permSlug) => {
        if (role.permissions?.includes('*')) return 'full';
        return role.permissions?.includes(permSlug) ? 'yes' : 'no';
    };

    const getCategoryIcon = (category) => {
        const icons = {
            'Facilities': 'Building2',
            'facilities': 'Building2',
            'Users': 'Users',
            'users': 'Users',
            'Reports': 'FileText',
            'reports': 'FileText',
            'Settings': 'Settings',
            'settings': 'Settings',
            'Audit': 'History',
            'audit': 'History',
            'Workflow': 'GitBranch',
            'workflow': 'GitBranch'
        };
        return icons[category] || 'Key';
    };

    if (loading) {
        return (
            <div className="bg-card rounded-xl border border-border p-8">
                <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="text-muted-foreground">Loading permissions matrix...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">Permissions Matrix</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        View which roles have access to specific system permissions
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg">
                    <Icon name="Info" size={14} />
                    <span>{permissions.length} permissions across {roles.length} roles</span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search permissions..."
                        className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`
                                px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize
                                ${selectedCategory === cat
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                                }
                            `}
                        >
                            {cat === 'all' ? 'All' : cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Matrix Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50 border-b border-border sticky top-0">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[250px]">
                                    Permission
                                </th>
                                {roles.map(role => (
                                    <th
                                        key={role.id}
                                        className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                                    >
                                        <div className="flex flex-col items-center gap-1">
                                            <Icon name="Shield" size={14} className="opacity-50" />
                                            <span className="text-[10px]">{role.name.replace(/_/g, ' ')}</span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredPermissions.length === 0 ? (
                                <tr>
                                    <td colSpan={roles.length + 1} className="text-center py-12 text-muted-foreground">
                                        <Icon name="Search" size={32} className="mx-auto mb-3 opacity-50" />
                                        <p>No permissions match your search</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredPermissions.map(perm => {
                                    const cat = perm.category || perm.slug.split('.')[0];
                                    return (
                                        <tr key={perm.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                        <Icon name={getCategoryIcon(cat)} size={14} className="text-primary" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-sm font-mono text-primary block truncate">
                                                            {perm.slug}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground block truncate">
                                                            {perm.description}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            {roles.map(role => {
                                                const hasAccess = roleHasPermission(role, perm.slug);
                                                return (
                                                    <td key={role.id} className="px-3 py-3 text-center">
                                                        {hasAccess === 'full' ? (
                                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20">
                                                                <Icon name="Crown" size={12} className="text-amber-600" />
                                                            </span>
                                                        ) : hasAccess === 'yes' ? (
                                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-success/20">
                                                                <Icon name="Check" size={12} className="text-success" />
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted">
                                                                <Icon name="Minus" size={12} className="text-muted-foreground/50" />
                                                            </span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20">
                        <Icon name="Crown" size={10} className="text-amber-600" />
                    </span>
                    <span>Full Access (*)</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-success/20">
                        <Icon name="Check" size={10} className="text-success" />
                    </span>
                    <span>Has Permission</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted">
                        <Icon name="Minus" size={10} className="text-muted-foreground/50" />
                    </span>
                    <span>No Access</span>
                </div>
            </div>
        </div>
    );
};

export default PermissionsTable;
