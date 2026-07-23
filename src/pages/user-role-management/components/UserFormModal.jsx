import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import api from '../../../utils/api';

const UserFormModal = ({ isOpen, onClose, user, onSave, roles = [] }) => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        username: '',
        email: '',
        phone_number: '',
        role_id: '',
        password: '',
        facility_id: '',
        is_national: false,
        jurisdictions: [] // Array of { region_id, province_id, district_id, label }
    });

    // Jurisdiction Selection State
    const [locations, setLocations] = useState([]);
    const [selRegion, setSelRegion] = useState('');
    const [selProvince, setSelProvince] = useState('');
    const [selDistrict, setSelDistrict] = useState('');

    const [loading, setLoading] = useState(false);

    // Fetch locations hierarchy
    useEffect(() => {
        if (isOpen && locations.length === 0) {
            api.get('/facilities/locations')
                .then(res => setLocations(res.data))
                .catch(err => console.error("Failed to fetch locations", err));
        }
    }, [isOpen]);

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                username: user.username || '',
                email: user.email || '',
                phone_number: user.phone_number || '',
                role_id: user.role_id || '',
                facility_id: user.facility_id || '',
                active: user.active !== false, // Default to true if undefined, or use value
                is_national: user.is_national || false,
                jurisdictions: user.jurisdictions || [],
                // Initialize with Direct Permissions (Overrides), NOT effective role permissions
                permissions: user.direct_permissions || [],
                password: ''
            });
        } else {
            setFormData({
                first_name: '',
                last_name: '',
                username: '',
                email: '',
                phone_number: '',
                role_id: '',
                facility_id: '',
                active: true, // Default active for new users
                is_national: false,
                jurisdictions: [],
                password: ''
            });
        }
        // Reset selection state
        setSelRegion('');
        setSelProvince('');
        setSelDistrict('');
    }, [user, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAddJurisdiction = () => {
        const hasRegions = locations.length > 0 && !!locations[0].provinces;
        if (hasRegions && !selRegion) return;
        if (!hasRegions && !selProvince) return;

        let newItem = {};
        let label = '';

        // Find names
        const regionObj = hasRegions ? locations.find(r => r.id == selRegion) : null;
        const provinceObj = hasRegions 
            ? regionObj?.provinces?.find(p => p.id == selProvince)
            : locations.find(p => p.id == selProvince);
        const districtObj = provinceObj?.districts?.find(d => d.id == selDistrict);

        if (selDistrict) {
            newItem = { region_id: selRegion ? parseInt(selRegion) : null, province_id: parseInt(selProvince), district_id: parseInt(selDistrict) };
            label = `District: ${districtObj?.name} (${provinceObj?.name})`;
        } else if (selProvince) {
            newItem = { region_id: selRegion ? parseInt(selRegion) : null, province_id: parseInt(selProvince), district_id: null };
            label = `Province: ${provinceObj?.name}`;
        } else {
            newItem = { region_id: parseInt(selRegion), province_id: null, district_id: null };
            label = `Region: ${regionObj?.name}`;
        }

        // Avoid duplicates
        const exists = formData.jurisdictions.some(j =>
            j.region_id === newItem.region_id &&
            j.province_id === newItem.province_id &&
            j.district_id === newItem.district_id
        );

        if (!exists) {
            setFormData(prev => ({
                ...prev,
                jurisdictions: [...prev.jurisdictions, { ...newItem, label }] // Store label for UI
            }));
        }

        // Reset lower levels but keep Region/Province for faster data entry
        // setSelDistrict('');
        // Logic check: if adding a district, clear district but keep province.
        // If adding a province, clear province but keep region.

        if (newItem.district_id) {
            setSelDistrict('');
        } else if (newItem.province_id) {
            setSelProvince('');
            setSelDistrict(''); // clear child
        } else {
            setSelRegion('');
            setSelProvince('');
            setSelDistrict('');
        }
    };

    const handleRemoveJurisdiction = (index) => {
        setFormData(prev => ({
            ...prev,
            jurisdictions: prev.jurisdictions.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...formData };

            // Fix empty integer fields
            // Fix empty integer fields - Robust Sanitization
            payload.facility_id = payload.facility_id ? parseInt(payload.facility_id) : null;
            payload.role_id = payload.role_id ? parseInt(payload.role_id) : null;
            if (isNaN(payload.facility_id)) payload.facility_id = null;
            if (isNaN(payload.role_id)) payload.role_id = null;

            if (payload.is_national) {
                payload.jurisdictions = []; // Clear specific jurisdictions if national
            }

            if (user) {
                const res = await api.put(`/users/${user.id}`, payload);
                onSave(res.data);
            } else {
                const res = await api.post('/users', payload);
                onSave(res.data);
            }
            onClose();
        } catch (err) {
            alert("Error saving user: " + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Helpers for dropdown options
    const hasRegions = locations.length > 0 && !!locations[0].provinces;
    const provinces = hasRegions 
        ? (selRegion ? locations.find(r => r.id == selRegion)?.provinces || [] : [])
        : locations;
    const districts = selProvince ? provinces.find(p => p.id == selProvince)?.districts || [] : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {user ? 'Edit User Profile' : 'Add New User'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <Icon name="X" size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-grow">

                    {/* Access Control Section */}
                    <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Account & Access</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="username"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.username}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    disabled={!!user}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role <span className="text-red-500">*</span></label>
                                <select
                                    name="role_id"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.role_id}
                                    onChange={e => setFormData(prev => ({ ...prev, role_id: parseInt(e.target.value) || '' }))}
                                >
                                    <option value="">Select Role</option>
                                    {roles.length > 0 ? (
                                        roles.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))
                                    ) : (
                                        <option value="" disabled>Loading Roles...</option>
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {user ? 'New Password (Optional)' : 'Password *'}
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    required={!user}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder={user ? "Leave blank to keep current" : ""}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Personal Information */}
                    <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Personal Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    type="text"
                                    name="phone_number"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.phone_number}
                                    onChange={handleChange}
                                />
                            </div>
                            {/* Facility ID could involve a search/dropdown if needed, keeping simple for now */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Facility ID (Optional)</label>
                                <input
                                    type="number"
                                    name="facility_id"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={formData.facility_id}
                                    onChange={handleChange}
                                    placeholder="e.g. 1023"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Jurisdiction Manager */}
                    <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Jurisdiction Scope</h4>
                        {/* ... Existing Jurisdiction Code ... */}

                        <div className="mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="is_national"
                                    checked={formData.is_national}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                />
                                <span className="text-sm font-medium text-gray-900">National Level Access</span>
                            </label>
                            <p className="text-xs text-gray-500 ml-6 mt-1">Checking this will grant access to ALL locations.</p>
                        </div>

                        <div className="mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="active"
                                    checked={formData.active}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                />
                                <span className="text-sm font-medium text-gray-900">Active Account</span>
                            </label>
                            <p className="text-xs text-gray-500 ml-6 mt-1">Uncheck to suspend user access without deleting.</p>
                        </div>

                        {!formData.is_national && (
                            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                                {/* ... Existing dropdowns code ... */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                                    {hasRegions && (
                                        <select
                                            className="text-sm border-gray-300 rounded-md"
                                            value={selRegion}
                                            onChange={e => { setSelRegion(e.target.value); setSelProvince(''); setSelDistrict(''); }}
                                        >
                                            <option value="">Select Region...</option>
                                            {locations.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </select>
                                    )}

                                    <select
                                        className="text-sm border-gray-300 rounded-md"
                                        value={selProvince}
                                        onChange={e => { setSelProvince(e.target.value); setSelDistrict(''); }}
                                        disabled={hasRegions && !selRegion}
                                    >
                                        <option value="">Select Province...</option>
                                        {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>

                                    <select
                                        className="text-sm border-gray-300 rounded-md"
                                        value={selDistrict}
                                        onChange={e => setSelDistrict(e.target.value)}
                                        disabled={!selProvince || districts.length === 0}
                                        style={{ display: 'none' }} // Hide old dropdown
                                    >
                                        <option value="">Select District (Opt)...</option>
                                    </select>
                                </div>

                                {/* New Multi-Select UI for Districts */}
                                {selProvince && (
                                    <div className="mb-4 p-3 bg-white border border-gray-200 rounded max-h-40 overflow-y-auto">
                                        <div className="text-xs font-semibold text-gray-500 mb-2 sticky top-0 bg-white">Select Districts:</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {districts.map(d => {
                                                const isSelected = formData.jurisdictions.some(j => j.district_id === d.id);
                                                return (
                                                    <label key={d.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    // Add
                                                                    const regionObj = hasRegions ? locations.find(r => r.id == selRegion) : null;
                                                                    const provinceObj = provinces.find(p => p.id == selProvince);
                                                                    const newItem = {
                                                                        region_id: selRegion ? parseInt(selRegion) : null,
                                                                        province_id: parseInt(selProvince),
                                                                        district_id: d.id,
                                                                        label: `District: ${d.name} (${provinceObj?.name})`
                                                                    };
                                                                    setFormData(prev => ({ ...prev, jurisdictions: [...prev.jurisdictions, newItem] }));
                                                                } else {
                                                                    // Remove
                                                                    setFormData(prev => ({ ...prev, jurisdictions: prev.jurisdictions.filter(j => j.district_id !== d.id) }));
                                                                }
                                                            }}
                                                            className="text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                                        />
                                                        {d.name}
                                                    </label>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Fallback Add Button */}
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={handleAddJurisdiction}
                                        disabled={hasRegions ? !selRegion : false}
                                        className="py-1.5 px-3 text-xs font-medium text-white bg-gray-700 hover:bg-gray-800 rounded disabled:opacity-50"
                                    >
                                        + Add Entire {selProvince ? 'Province' : 'Region'} Scope
                                    </button>
                                    <p className="text-xs text-gray-500 self-center">
                                        (Use checkboxes above for specific districts, or click here to add whole area)
                                    </p>
                                </div>

                                {/* List of added jurisdictions */}
                                {formData.jurisdictions.length > 0 ? (
                                    <ul className="space-y-2 mt-4">
                                        {formData.jurisdictions.map((item, idx) => (
                                            <li key={idx} className="flex items-center justify-between text-sm bg-white p-2 rounded border border-gray-200 shadow-sm">
                                                <span>{item.label || item.region_name || item.name || `Region ID: ${item.region_id}`}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveJurisdiction(idx)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Icon name="Trash2" size={14} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs text-gray-500 italic text-center py-2 mt-2">No jurisdictions added. User will have no location access.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Permission Manager */}
                    {formData.role_id && (
                        <div className="mb-6">
                            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 border-b pb-2">Effective Permissions</h4>
                            <p className="text-xs text-gray-500 mb-3">User has permissions from their <strong>Role</strong> plus any <strong>Directly Assigned</strong> ones.</p>

                            <PermissionMatrix
                                roleId={formData.role_id}
                                assignedPerms={formData.permissions || []}
                                onChange={(newPerms) => setFormData(prev => ({ ...prev, permissions: newPerms }))}
                            />
                        </div>
                    )}
                </form>

                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md border border-gray-200"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save User Profile'}
                    </button>
                </div>
            </div>
        </div>
    );
};


const PermissionMatrix = ({ roleId, assignedPerms, onChange }) => {
    const [allPerms, setAllPerms] = useState([]);
    const [rolePerms, setRolePerms] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch all permissions (Using admin table endpoint as shortcut)
                const permRes = await api.get('/admin/tables/permissions');
                setAllPerms(Array.isArray(permRes.data) ? permRes.data : []);

                // Fetch Role Permissions
                // Fetching entire table might fail (400) if too large or restricted
                try {
                    const rolePermRes = await api.get('/admin/tables/role_permissions');
                    if (Array.isArray(rolePermRes.data)) {
                        const myRolePerms = rolePermRes.data
                            .filter(rp => rp.role_id == roleId)
                            .map(rp => rp.permission_id);
                        setRolePerms(myRolePerms);
                    }
                } catch (rpErr) {
                    console.warn("Failed to fetch default role permissions (ignoring):", rpErr);
                    setRolePerms([]);
                }

            } catch (err) {
                console.error("Error fetching permissions metadata", err);
            } finally {
                setLoading(false);
            }
        };
        if (roleId) fetchData();
    }, [roleId]);

    const handleToggle = (permId, isChecked) => {
        // If checked, we add to assignedPerms with is_granted=true
        // If unchecked
        //    If it was in rolePerms -> We MUST add explicit Deny (is_granted=false)? 
        //    Actually, user asked to "Assign or Revoke".
        //    Let's implement: 
        //      - Checked = Allow (Either via Role or Explicit Grant)
        //      - Unchecked = Deny (Either via Role absence or Explicit Deny)

        let newAssigned = [...assignedPerms];
        const isDefaultGranted = rolePerms.includes(permId);

        // Remove existing override for this perm
        newAssigned = newAssigned.filter(p => p.permission_id !== permId);

        if (isChecked) {
            if (!isDefaultGranted) {
                // Granting something that isn't default
                newAssigned.push({ permission_id: permId, is_granted: true });
            }
            // If default granted, we just removed the override, so it falls back to true. Correct.
        } else {
            if (isDefaultGranted) {
                // Revoking something that IS default
                newAssigned.push({ permission_id: permId, is_granted: false });
            }
            // If not default granted, we removed override, falls back to false. Correct.
        }

        onChange(newAssigned);
    };

    if (loading) return <div className="text-xs text-gray-500">Loading permissions...</div>;

    // Group by resource/module if possible, or just list
    return (
        <div className="bg-gray-50 p-4 rounded border border-gray-200 max-h-60 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2">
            {allPerms.map(p => {
                const override = assignedPerms.find(ap => ap.permission_id === p.id);
                const isRoleGranted = rolePerms.includes(p.id);

                // Effective State
                let isGranted = isRoleGranted;
                if (override) {
                    isGranted = override.is_granted;
                }

                // UI State
                const boxColor = override
                    ? (override.is_granted ? 'text-green-600 font-bold' : 'text-red-500 font-bold')
                    : (isRoleGranted ? 'text-gray-700' : 'text-gray-400');

                return (
                    <label key={p.id} className="flex items-center gap-2 text-sm p-1 hover:bg-white rounded cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isGranted}
                            onChange={e => handleToggle(p.id, e.target.checked)}
                            className={`rounded border-gray-300 ${isGranted ? 'text-indigo-600' : ''}`}
                        />
                        <span className={boxColor}>{p.slug}</span>
                        {override && <span className="text-xs bg-gray-200 px-1 rounded ml-auto">{override.is_granted ? 'Added' : 'Revoked'}</span>}
                        {isRoleGranted && !override && <span className="text-xs text-gray-400 border border-gray-200 px-1 rounded ml-auto">Role</span>}
                    </label>
                );
            })}
        </div>
    );
};

export default UserFormModal;
