import React, { useState } from 'react';
import { SidebarProvider } from '../../components/navigation/Sidebar';
import Sidebar from '../../components/navigation/Sidebar';
import MobileMenuButton from '../../components/navigation/MobileMenuButton';
import WorkflowStatusIndicator from '../../components/navigation/WorkflowStatusIndicator';
import IntegrationHealthMonitor from '../../components/navigation/IntegrationHealthMonitor';
import Icon from '../../components/AppIcon';

import UserDirectoryTable from './components/UserDirectoryTable';
import UserProfilePanel from './components/UserProfilePanel';
import SearchFilterBar from './components/SearchFilterBar';
import StatsOverview from './components/StatsOverview';
import BulkActionModal from './components/BulkActionModal';
import UserFormModal from './components/UserFormModal';
import GroupsTable from './components/GroupsTable';
import RolesTable from './components/RolesTable';
import PermissionsTable from './components/PermissionsTable';
import api from '../../utils/api';

const UserRoleManagement = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupsError, setGroupsError] = useState(null); // Debug state
  const [loading, setLoading] = useState(true);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [activeTab, setActiveTab] = useState('users');

  // State for Modal
  const [roles, setRoles] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [bulkActionModal, setBulkActionModal] = useState({
    isOpen: false,
    actionType: null,
    selectedUsers: []
  });

  const mockUsers = [
    // ... fallback mock data if needed, but keeping it empty or minimal for now to save space
  ];

  const stats = {
    totalUsers: users.length || 0,
    activeUsers: users.filter(u => u.active).length || 0,
    pendingApprovals: 0,
    suspendedAccounts: 0
  };

  // Fetch users & roles
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Use Promise.allSettled so one failure doesn't break everything
        const results = await Promise.allSettled([
          api.get('/users'),
          api.get('/admin/tables/roles'),
          api.get('/groups')
        ]);

        const [usersResult, rolesResult, groupsResult] = results;

        // Handle Users
        if (usersResult.status === 'fulfilled' && Array.isArray(usersResult.value.data)) {
          setUsers(usersResult.value.data);
        } else {
          console.warn("Users fetch failed or invalid:", usersResult.reason || usersResult.value);
          setUsers([]);
        }

        // Handle Roles
        if (rolesResult.status === 'fulfilled' && Array.isArray(rolesResult.value.data)) {
          setRoles(rolesResult.value.data);
        } else {
          console.warn("Roles fetch failed:", rolesResult.reason);
          // Fallback roles if API fails
          setRoles([
            { id: 1, name: 'NATIONAL_ADMIN' },
            { id: 2, name: 'PROVINCIAL_ADMIN' },
            { id: 3, name: 'DISTRICT_ADMIN' },
            { id: 4, name: 'FACILITY_OFFICER' },
            { id: 5, name: 'SYSTEM_ADMIN' }
          ]);
        }

        // Handle Groups
        if (groupsResult.status === 'fulfilled' && Array.isArray(groupsResult.value.data)) {
          setGroups(groupsResult.value.data);
        } else {
          const errorMsg = groupsResult.reason ? (groupsResult.reason.message + (groupsResult.reason.response ? ` Status: ${groupsResult.reason.response.status}` : '')) : 'Unknown error';
          console.warn("Groups fetch failed:", groupsResult.reason);
          // DEBUG: Alert the user to the specific error
          // alert(`Debug: Groups fetch failed. Error: ${errorMsg}`); 
          // Commented out alert, but logging to console. 
          // Let's store error in state to display
          setGroupsError(errorMsg);
          setGroups([]);
        }

      } catch (error) {
        console.error("Unexpected error in fetchData", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setShowProfilePanel(true);
  };

  const handleCloseProfile = () => {
    setShowProfilePanel(false);
    setSelectedUser(null);
  };

  const handleSearch = (query) => {
    console.log('Search query:', query);
    // Implement search filter logic here if needed
  };

  const handleFilter = (filters) => {
    console.log('Applied filters:', filters);
  };

  const handleExport = () => {
    console.log('Exporting user report...');
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleBulkAction = (actionType, selectedUsers) => {
    setBulkActionModal({
      isOpen: true,
      actionType,
      selectedUsers
    });
  };

  const handleConfirmBulkAction = (actionType, value) => {
    console.log('Bulk action confirmed:', actionType, value, bulkActionModal?.selectedUsers);
    setBulkActionModal({ isOpen: false, actionType: null, selectedUsers: [] });
  };

  const handleUserAction = async (action, user) => {
    if (action === 'changeRole' || action === 'edit') {
      setEditingUser(user);
      setIsFormOpen(true);
    } else if (action === 'resetPassword') {
      const newPassword = prompt(`Enter new password for ${user.username || user.name}:`);
      if (!newPassword) return; // User cancelled or empty
      try {
        // Assuming the backend supports updating password via PUT /users/:id
        // If not, this might need adjustment to /users/:id/reset-password
        await api.put(`/users/${user.id}`, { password: newPassword });
        alert("Password updated successfully.");
      } catch (err) {
        console.error("Password reset failed", err);
        alert("Failed to reset password: " + (err.response?.data?.error || err.message));
      }
    } else if (action === 'suspend' || action === 'delete') {
      if (!window.confirm(`Are you sure you want to ${action} ${user.username || user.name}?`)) return;
      try {
        if (action === 'delete') {
          await api.delete(`/users/${user.id}`);
          setUsers(prev => prev.filter(u => u.id !== user.id));
          if (selectedUser?.id === user.id) setSelectedUser(null);
        } else if (action === 'suspend') {
          // assume update status logic
          // await api.put(...)
        }
      } catch (err) {
        alert("Error: " + err.message);
      }
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to refresh users", error);
    }
  };

  const handleSaveUser = async (savedUser) => {
    await fetchUsers(); // Re-fetch to get full joined data (Names, Jurisdictions)
    setIsFormOpen(false); // Close modal here if not already handled
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background">
        <MobileMenuButton />
        <Sidebar />


        <main className="main-content">
          <div className="p-6 lg:p-8">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">User & Role Management</h1>
                  <p className="text-muted-foreground">
                    Manage system access, permissions, and organizational hierarchy
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <IntegrationHealthMonitor />
                  <WorkflowStatusIndicator isFixed={false} />
                </div>
              </div>
            </div>

            {/* Debug error removed */}

            <StatsOverview stats={stats} roles={roles} groups={groups} />

            {/* Tabs */}
            <div className="flex overflow-x-auto scrollbar-thin gap-3 pb-2 mb-6 -mx-1 px-1">
              {[
                { id: 'users', label: 'Users', icon: 'User' },
                { id: 'groups', label: 'Groups', icon: 'Users' },
                { id: 'roles', label: 'Roles', icon: 'Shield' },
                { id: 'permissions', label: 'Permissions', icon: 'Lock' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative group flex items-center gap-2.5 px-5 py-3 rounded-2xl whitespace-nowrap text-sm font-medium transition-all duration-300 ease-out
                    border
                    ${activeTab === tab.id
                      ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/25 ring-2 ring-primary/20 ring-offset-1 ring-offset-background z-10'
                      : 'bg-card border-border/50 text-muted-foreground hover:bg-accent hover:text-foreground hover:border-foreground/10 hover:shadow-md'
                    }
                  `}
                >
                  <Icon
                    name={tab.icon}
                    size={18}
                    className={`transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110 opacity-70 group-hover:opacity-100'}`}
                  />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'users' && (
              <>
                <SearchFilterBar
                  onSearch={handleSearch}
                  onFilter={handleFilter}
                  onExport={handleExport}
                  onAddUser={handleAddUser} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className={showProfilePanel ? 'lg:col-span-7' : 'lg:col-span-12'}>
                    <UserDirectoryTable
                      users={users}
                      selectedUser={selectedUser}
                      onSelectUser={handleSelectUser}
                      onBulkAction={handleBulkAction}
                      onAction={handleUserAction}
                    />
                  </div>

                  {showProfilePanel &&
                    <div className="lg:col-span-5">
                      <div className="sticky top-6">
                        <UserProfilePanel
                          user={selectedUser}
                          onClose={handleCloseProfile}
                          onAction={handleUserAction} />
                      </div>
                    </div>
                  }
                </div>
              </>
            )}

            {activeTab === 'groups' && <GroupsTable />}

            {activeTab === 'roles' && <RolesTable />}

            {activeTab === 'permissions' && <PermissionsTable />}

          </div>
        </main>

        <BulkActionModal
          isOpen={bulkActionModal.isOpen}
          onClose={() => setBulkActionModal({ isOpen: false, actionType: null, selectedUsers: [] })}
          actionType={bulkActionModal.actionType}
          selectedCount={bulkActionModal.selectedUsers?.length}
          onConfirm={handleConfirmBulkAction} />

        <UserFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          user={editingUser}
          roles={roles}
          onSave={handleSaveUser}
        />

      </div>
    </SidebarProvider>
  );
};

export default UserRoleManagement;