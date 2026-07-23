import React, { useState } from 'react';

import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';

const SearchFilterBar = ({ onSearch, onFilter, onExport, onAddUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('');

  const roleOptions = [
    { value: '', label: 'All Roles' },
    { value: 'national-admin', label: 'National Administrator' },
    { value: 'province-coordinator', label: 'Province Coordinator' },
    { value: 'district-coordinator', label: 'District Coordinator' },
    { value: 'facility-user', label: 'Facility User' },
    { value: 'system-integrator', label: 'System Integrator' },
    { value: 'auditor', label: 'Auditor' },
    { value: 'public-viewer', label: 'Public Viewer' }
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'suspended', label: 'Suspended' }
  ];

  const jurisdictionOptions = [
    { value: '', label: 'All Jurisdictions' },
    { value: 'national', label: 'National Level' },
    { value: 'province-a', label: 'Province A' },
    { value: 'province-b', label: 'Province B' },
    { value: 'district-1', label: 'District 1' },
    { value: 'district-2', label: 'District 2' }
  ];

  const handleSearch = (value) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleApplyFilters = () => {
    onFilter({
      role: selectedRole,
      status: selectedStatus,
      jurisdiction: selectedJurisdiction
    });
  };

  const handleClearFilters = () => {
    setSelectedRole('');
    setSelectedStatus('');
    setSelectedJurisdiction('');
    onFilter({
      role: '',
      status: '',
      jurisdiction: ''
    });
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-4">
          <Input
            type="search"
            placeholder="Search by name, email, or ID..."
            value={searchQuery}
            onChange={(e) => handleSearch(e?.target?.value)}
            className="w-full"
          />
        </div>

        <div className="lg:col-span-2">
          <Select
            options={roleOptions}
            value={selectedRole}
            onChange={setSelectedRole}
            placeholder="Filter by role"
          />
        </div>

        <div className="lg:col-span-2">
          <Select
            options={statusOptions}
            value={selectedStatus}
            onChange={setSelectedStatus}
            placeholder="Filter by status"
          />
        </div>

        <div className="lg:col-span-2">
          <Select
            options={jurisdictionOptions}
            value={selectedJurisdiction}
            onChange={setSelectedJurisdiction}
            placeholder="Filter by jurisdiction"
          />
        </div>

        <div className="lg:col-span-2 flex gap-2">
          <Button
            variant="outline"
            size="default"
            iconName="Filter"
            onClick={handleApplyFilters}
            fullWidth
          >
            Apply
          </Button>
          <Button
            variant="ghost"
            size="default"
            iconName="X"
            onClick={handleClearFilters}
          >
            Clear
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-4">
          <Button
            variant="default"
            size="default"
            iconName="UserPlus"
            iconPosition="left"
            onClick={onAddUser}
          >
            Add New User
          </Button>
          <Button
            variant="outline"
            size="default"
            iconName="Upload"
            iconPosition="left"
          >
            Import Users
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="default"
            iconName="Download"
            iconPosition="left"
            onClick={onExport}
          >
            Export Report
          </Button>
          <Button
            variant="outline"
            size="default"
            iconName="Settings"
          >
            Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchFilterBar;