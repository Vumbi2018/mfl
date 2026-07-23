import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';
import api from '../../../utils/api';

const QuickDataEntryForm = ({ facility, initialData, onDataChange, onSubmit, onCancel }) => {
  // DB Schema Aligned State
  const [formData, setFormData] = useState(initialData || {
    name: facility?.name || facility?.common_name || '',
    type: facility?.type || facility?.facility_type || '',
    operational_status: facility?.operational_status || facility?.status || facility?.facility_status || 'Operational',
    region_id: facility?.region_id?.toString() || '',
    province_id: facility?.province_id?.toString() || '',
    district_id: facility?.district_id?.toString() || '',
    llg_id: facility?.llg_id?.toString() || '',
    ward_id: facility?.ward_id?.toString() || '',
    operating_hours: facility?.operating_hours || facility?.operational_hours || '',
    total_beds: facility?.total_beds || facility?.bed_count || facility?.bedCapacity || '',
    total_staff: facility?.total_staff || facility?.staff_count || facility?.staffCount || '',
    emergency_services: facility?.emergency_services || false,
    has_ambulance: facility?.has_ambulance || facility?.ambulance_available || false,
    services: Array.isArray(facility?.services) ? facility.services : []
  });

  // Notify parent of changes for draft persistence
  useEffect(() => {
    onDataChange?.(formData);
  }, [formData]);

  const [locations, setLocations] = useState([]);
  const [facilityTypes, setFacilityTypes] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  // Derived Location Lists
  const availableProvinces = formData.region_id
    ? locations.find(r => r.id === parseInt(formData.region_id))?.provinces || []
    : [];

  const availableDistricts = formData.province_id
    ? availableProvinces.find(p => p.id === parseInt(formData.province_id))?.districts || []
    : [];

  // Fetch Reference Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [typesRes, locRes] = await Promise.all([
          api.get('/facilities/types'),
          api.get('/facilities/locations')
        ]);
        setFacilityTypes(typesRes.data.map(t => ({ value: t, label: t })));
        setLocations(locRes.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching reference data:", err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear dependent location fields if parent changes
    if (field === 'region_id') {
      setFormData(prev => ({ ...prev, [field]: value, province_id: '', district_id: '' }));
    } else if (field === 'province_id') {
      setFormData(prev => ({ ...prev, [field]: value, district_id: '' }));
    }

    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.name?.trim()) newErrors.name = 'Facility name is required';
    if (!formData?.type) newErrors.type = 'Facility type is required';
    if (!formData?.region_id) newErrors.region_id = 'Region is required';
    if (!formData?.province_id) newErrors.province_id = 'Province is required';
    if (!formData?.district_id) newErrors.district_id = 'District is required';

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  // Hardcoded for now if no API endpoint for generic services list, 
  // but logically these should eventually be fetched too.
  const serviceOptions = [
    { value: 'Outpatient Services', label: 'Outpatient Services' },
    { value: 'Inpatient Services', label: 'Inpatient Services' },
    { value: 'Emergency Care', label: 'Emergency Care' },
    { value: 'Maternity', label: 'Maternity' },
    { value: 'Pharmacy', label: 'Pharmacy' },
    { value: 'Laboratory', label: 'Laboratory' }
  ];

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading form data...</div>;
  }

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="FileEdit" size={20} className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Quick Data Entry</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <Icon name="X" size={20} />
          </Button>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="p-4 space-y-4">

        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Facility Name"
            type="text"
            placeholder="Enter facility name"
            value={formData?.name}
            onChange={(e) => handleInputChange('name', e?.target?.value)}
            error={errors?.name}
            required
          />

          <Select
            label="Facility Type"
            options={facilityTypes}
            value={formData?.type}
            onChange={(value) => handleInputChange('type', value)}
            error={errors?.type}
            required
          />
        </div>

        {/* Status & Hours */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Operational Status"
            options={[
              { value: 'Operational', label: 'Operational' },
              { value: 'Closed', label: 'Closed' },
              { value: 'Pending', label: 'Pending' },
              { value: 'Temporarily Closed', label: 'Temporarily Closed' }
            ]}
            value={formData?.operational_status}
            onChange={(value) => handleInputChange('operational_status', value)}
          />
          <Input
            label="Operating Hours"
            type="text"
            placeholder="e.g., Mon-Fri 8am-4pm"
            value={formData?.operating_hours}
            onChange={(e) => handleInputChange('operating_hours', e?.target?.value)}
          />
        </div>

        {/* Location Cascade */}
        <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border/50">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Icon name="MapPin" size={14} /> Location Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Region"
              options={locations.map(r => ({ value: r.id.toString(), label: r.name }))}
              value={formData?.region_id}
              onChange={(value) => handleInputChange('region_id', value)}
              error={errors?.region_id}
              required
            />
            <Select
              label="Province"
              options={availableProvinces.map(p => ({ value: p.id.toString(), label: p.name }))}
              value={formData?.province_id}
              onChange={(value) => handleInputChange('province_id', value)}
              disabled={!formData.region_id}
              error={errors?.province_id}
              required
            />
            <Select
              label="District"
              options={availableDistricts.map(d => ({ value: d.id.toString(), label: d.name }))}
              value={formData?.district_id}
              onChange={(value) => handleInputChange('district_id', value)}
              disabled={!formData.province_id}
              error={errors?.district_id}
              required
            />
          </div>
        </div>

        {/* Capacity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Bed Count"
            type="number"
            placeholder="Number of beds"
            value={formData?.total_beds}
            onChange={(e) => handleInputChange('total_beds', e?.target?.value)}
            min="0"
          />

          <Input
            label="Staff Count"
            type="number"
            placeholder="Number of staff"
            value={formData?.total_staff}
            onChange={(e) => handleInputChange('total_staff', e?.target?.value)}
            min="0"
          />
        </div>

        {/* Features */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Facility Features</label>
          <div className="flex flex-wrap gap-4">
            <Checkbox
              label="Emergency Services"
              checked={formData?.emergency_services}
              onChange={(e) => handleInputChange('emergency_services', e?.target?.checked)}
            />
            <Checkbox
              label="Ambulance Available"
              checked={formData?.has_ambulance}
              onChange={(e) => handleInputChange('has_ambulance', e?.target?.checked)}
            />
          </div>
        </div>

        <Select
          label="Services Provided"
          options={serviceOptions}
          value={formData?.services}
          onChange={(value) => handleInputChange('services', value)}
          multiple
          searchable
          description="Select all services provided at this facility"
        />

        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} fullWidth>
            Cancel
          </Button>
          {/* Global 'Complete Submission' button handles saving now */}
        </div>
      </form>
    </div>
  );
};

export default QuickDataEntryForm;