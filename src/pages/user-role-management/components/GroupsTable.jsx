import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import api from '../../../utils/api';

const GroupsTable = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: ''
    });

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const res = await api.get('/groups'); // New endpoint with counts
            setGroups(res.data || []);
        } catch (err) {
            console.error("Failed to fetch groups", err);
            // Fallback mock data
            setGroups([]);
            // Removed mock data fallback as per user request to not use hardcoded data
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (group = null) => {
        if (group) {
            setEditingGroup(group);
            setFormData({
                name: group.name || '',
                code: group.code || '',
                description: group.description || ''
            });
        } else {
            setEditingGroup(null);
            setFormData({ name: '', code: '', description: '' });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            alert('Group name is required');
            return;
        }

        setSaving(true);
        try {
            if (editingGroup) {
                await api.put(`/admin/tables/groups/${editingGroup.id}`, formData);
            } else {
                await api.post('/admin/tables/groups', formData);
            }
            await fetchGroups();
            setIsModalOpen(false);
        } catch (err) {
            console.error("Failed to save group", err);
            alert('Failed to save group: ' + (err.response?.data?.error || err.message));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (group) => {
        if (!window.confirm(`Are you sure you want to delete the group "${group.name}"?`)) return;

        try {
            await api.delete(`/admin/tables/groups/${group.id}`);
            await fetchGroups();
        } catch (err) {
            console.error("Failed to delete group", err);
            alert('Failed to delete group: ' + (err.response?.data?.error || err.message));
        }
    };

    const getGroupColor = (index) => {
        const colors = [
            'bg-blue-500/10 text-blue-600 border-blue-200',
            'bg-purple-500/10 text-purple-600 border-purple-200',
            'bg-emerald-500/10 text-emerald-600 border-emerald-200',
            'bg-amber-500/10 text-amber-600 border-amber-200',
            'bg-rose-500/10 text-rose-600 border-rose-200',
            'bg-cyan-500/10 text-cyan-600 border-cyan-200'
        ];
        return colors[index % colors.length];
    };

    if (loading) {
        return (
            <div className="bg-card rounded-xl border border-border p-8">
                <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="text-muted-foreground">Loading groups...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold text-foreground">User Groups</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Organize users into logical groups for easier management
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm shadow-sm"
                >
                    <Icon name="Plus" size={16} />
                    Create Group
                </button>
            </div>

            {/* Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.length === 0 ? (
                    <div className="col-span-full bg-card rounded-xl border border-border p-12 text-center">
                        <Icon name="FolderKanban" size={48} className="mx-auto mb-4 text-muted-foreground/50" />
                        <h3 className="text-lg font-medium text-foreground mb-2">No Groups Yet</h3>
                        <p className="text-muted-foreground mb-4">Create your first group to organize users</p>
                        <button
                            onClick={() => handleOpenModal()}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                        >
                            <Icon name="Plus" size={16} />
                            Create First Group
                        </button>
                    </div>
                ) : (
                    groups.map((group, idx) => (
                        <div
                            key={group.id}
                            className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-md transition-all group"
                        >
                            <div className={`h-2 ${getGroupColor(idx).split(' ')[0]}`} />
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getGroupColor(idx)}`}>
                                        <Icon name="Users" size={18} />
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleOpenModal(group)}
                                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                                            title="Edit Group"
                                        >
                                            <Icon name="Pencil" size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(group)}
                                            className="p-1.5 text-muted-foreground hover:text-error hover:bg-error/10 rounded-md transition-colors"
                                            title="Delete Group"
                                        >
                                            <Icon name="Trash2" size={14} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-base font-semibold text-foreground mb-1">{group.name}</h3>
                                <span className="inline-block px-2 py-0.5 text-xs font-mono bg-muted rounded text-muted-foreground mb-2">
                                    {group.code}
                                </span>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                    {group.description || 'No description'}
                                </p>

                                <div className="flex items-center justify-between pt-3 border-t border-border text-sm">
                                    <span className="flex items-center gap-1.5 text-muted-foreground">
                                        <Icon name="Users" size={14} />
                                        {group.members || 0} members
                                    </span>
                                    <button className="text-primary hover:text-primary/80 font-medium text-xs">
                                        View Members →
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h3 className="text-lg font-semibold text-foreground">
                                {editingGroup ? 'Edit Group' : 'Create New Group'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                            >
                                <Icon name="X" size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Group Name <span className="text-error">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Western Region"
                                    className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Group Code
                                </label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    placeholder="e.g., WR"
                                    maxLength={10}
                                    className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of this group..."
                                    rows={3}
                                    className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/30 rounded-b-2xl">
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
                                        {editingGroup ? 'Update' : 'Create'}
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

export default GroupsTable;
