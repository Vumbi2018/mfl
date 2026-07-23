import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const UserDirectoryTable = ({ users, selectedUser, onSelectUser, onBulkAction, onAction }) => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedUsers(users?.map(u => u?.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId, checked) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers?.filter(id => id !== userId));
      setSelectAll(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-success bg-success/10';
      case 'inactive':
        return 'text-muted-foreground bg-muted';
      case 'suspended':
        return 'text-error bg-error/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const formatLastLogin = (date) => {
    if (!date) return 'Never';
    const loginDate = new Date(date);
    if (isNaN(loginDate.getTime())) return 'Never';
    
    const now = new Date();
    const diffMinutes = Math.floor((now - loginDate) / 60000);

    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  return (
    <div className="bg-card rounded-lg border border-border">
      {selectedUsers?.length > 0 && (
        <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5">
          <span className="text-sm font-medium text-foreground">
            {selectedUsers?.length} user{selectedUsers?.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onBulkAction('role', selectedUsers)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <Icon name="UserCog" size={16} />
              Change Role
            </button>
            <button
              onClick={() => onBulkAction('jurisdiction', selectedUsers)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <Icon name="MapPin" size={16} />
              Reassign
            </button>
            <button
              onClick={() => onBulkAction('suspend', selectedUsers)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-error hover:bg-error/10 rounded-md transition-colors"
            >
              <Icon name="Ban" size={16} />
              Suspend
            </button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={(e) => handleSelectAll(e?.target?.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/20"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">User</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Role</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Jurisdiction</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Last Login</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users?.map((user) => (
              <tr
                key={user?.id}
                onClick={() => onSelectUser(user)}
                className={`hover:bg-muted/50 cursor-pointer transition-colors ${selectedUser?.id === user?.id ? 'bg-primary/5' : ''
                  }`}
              >
                <td className="px-4 py-3" onClick={(e) => e?.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedUsers?.includes(user?.id)}
                    onChange={(e) => handleSelectUser(user?.id, e?.target?.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/20"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center text-gray-400 font-bold">
                      {/* Simple avatar fallback if no image */}
                      {(user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
                      </div>
                      <div className="text-sm text-muted-foreground">{user?.email}</div>
                      {user?.phone_number && <div className="text-xs text-muted-foreground">{user.phone_number}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Icon name="Shield" size={16} className="text-primary" />
                    <span className="text-sm text-foreground">{user?.role}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-foreground font-medium">
                    {user?.is_national ? (
                      <span className="text-indigo-600">National Level</span>
                    ) : (
                      user?.jurisdictions?.length > 1 ? (
                        <span title={user.jurisdictions.map(j => j.district_name || j.province_name || j.region_name).join(', ')}>
                          {user.jurisdictions.length} Locations
                        </span>
                      ) : (
                        user?.jurisdictions?.[0]?.district_name ||
                        user?.jurisdictions?.[0]?.province_name ||
                        user?.jurisdictions?.[0]?.region_name ||
                        'Unassigned'
                      )
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {user?.facility_name || user?.department || ''}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-foreground">{formatLastLogin(user?.lastLogin)}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(user?.status)}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {user?.status}
                  </span>
                </td>
                <td className="px-4 py-3" onClick={(e) => e?.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <button
                      className="p-1.5 hover:bg-muted rounded-md transition-colors"
                      title="Edit user"
                      onClick={(e) => { e.stopPropagation(); onAction ? onAction('edit', user) : null; }}
                    >
                      <Icon name="Edit2" size={16} className="text-muted-foreground" />
                    </button>
                    <button
                      className="p-1.5 hover:bg-muted rounded-md transition-colors"
                      title="View details"
                      onClick={(e) => { e.stopPropagation(); onSelectUser(user); }}
                    >
                      <Icon name="Eye" size={16} className="text-muted-foreground" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserDirectoryTable;