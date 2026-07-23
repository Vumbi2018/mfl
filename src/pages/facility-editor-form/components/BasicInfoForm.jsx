import React, { useEffect, useState } from 'react';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import api from '../../../utils/api';

const BasicInfoForm = ({ formData, onChange, readOnly }) => {
  const [facilityTypes, setFacilityTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  // Fetch WHO-aligned facility types from database
  useEffect(() => {
    const fetchFacilityTypes = async () => {
      try {
        const response = await api.get('/reference/facility-types');
        const types = response.data.map(t => ({
          value: t.code,
          label: `${t.name}${t.can_admit ? ' (Inpatient)' : ''}`
        }));
        setFacilityTypes(types);
      } catch (err) {
        console.error('Failed to fetch facility types:', err);
        // Fallback to hardcoded values if API fails
        setFacilityTypes([
          { value: 'NH', label: 'National Hospital (Inpatient)' },
          { value: 'PH', label: 'Provincial Hospital (Inpatient)' },
          { value: 'DH', label: 'District Hospital (Inpatient)' },
          { value: 'HC', label: 'Health Centre (Inpatient)' },
          { value: 'AP', label: 'Aid Post' },
          { value: 'SHC', label: 'Sub-Health Centre' },
          { value: 'UHC', label: 'Urban Health Centre' },
          { value: 'PRI', label: 'Private Clinic' }
        ]);
      } finally {
        setLoadingTypes(false);
      }
    };
    fetchFacilityTypes();
  }, []);

  const ownershipTypes = [
    { value: 'government', label: 'Government' },
    { value: 'church', label: 'Church/Faith-Based' },
    { value: 'private', label: 'Private For-Profit' },
    { value: 'ngo', label: 'NGO/Non-Profit' },
    { value: 'joint', label: 'Joint Venture (PPP)' }
  ];

  const operationalStatus = [
    { value: 'operational', label: 'Operational' },
    { value: 'under_construction', label: 'Under Construction' },
    { value: 'temporarily_closed', label: 'Temporarily Closed' },
    { value: 'permanently_closed', label: 'Permanently Closed' },
    { value: 'planned', label: 'Planned/Proposed' }
  ];

  return (
    <div className="space-y-6">
      {/* Facility Identification */}
      <div className="border-b pb-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Facility Identification</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Official Name"
            type="text"
            placeholder="Enter official facility name"
            value={formData?.name || ''}
            onChange={(e) => onChange('name', e?.target?.value)}
            required
            disabled={readOnly}
          />
          <div className="relative">
            <Input
              label="Facility Code (MFL ID)"
              type="text"
              placeholder="Auto-generated"
              value={formData?.code || (formData?.province_id && formData?.district_id
                ? `${String(formData.province_id).padStart(2, '0')}-${String(formData.district_id).padStart(2, '0')}-XXX-C`
                : '')}
              disabled
            />
            {!formData?.code && (
              <p className="text-[10px] text-muted-foreground mt-1 absolute right-1 top-0">
                Format: PP-DD-XXX-C
              </p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Input
            label="Local/Common Name (Optional)"
            type="text"
            placeholder="If different from official name"
            value={formData?.local_name || ''}
            onChange={(e) => onChange('local_name', e?.target?.value)}
            disabled={readOnly}
          />
          <Input
            label="HMIS Code"
            type="text"
            placeholder="Enter HMIS code"
            value={formData?.enhis_code || ''}
            onChange={(e) => onChange('enhis_code', e?.target?.value)}
            disabled={readOnly}
          />
        </div>
      </div>

      {/* Classification */}
      <div className="border-b pb-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Classification (WHO-Aligned)</h3>
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Facility Type"
            options={facilityTypes}
            value={formData?.type || ''}
            onChange={(value) => onChange('type', value)}
            required
            disabled={readOnly || loadingTypes}
          />
          <Select
            label="Ownership"
            options={ownershipTypes}
            value={formData?.ownership || ''}
            onChange={(value) => onChange('ownership', value)}
            required
            disabled={readOnly}
          />
        </div>
      </div>

      {/* Operational Status */}
      <div className="border-b pb-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Operational Status</h3>
        <div className="grid grid-cols-3 gap-4">
          <Select
            label="Status"
            options={operationalStatus}
            value={formData?.operational_status || ''}
            onChange={(value) => onChange('operational_status', value)}
            required
            disabled={readOnly}
          />
          <Input
            label="Date Established"
            type="date"
            value={formData?.date_established ? new Date(formData.date_established).toISOString().split('T')[0] : ''}
            onChange={(e) => onChange('date_established', e?.target?.value)}
            disabled={readOnly}
          />
          {(formData?.operational_status === 'temporarily_closed' || formData?.operational_status === 'permanently_closed') && (
            <Input
              label="Date Closed"
              type="date"
              value={formData?.date_closed ? new Date(formData.date_closed).toISOString().split('T')[0] : ''}
              onChange={(e) => onChange('date_closed', e?.target?.value)}
              disabled={readOnly}
            />
          )}
        </div>
      </div>

      {/* Registration & Licensing */}
      <div className="border-b pb-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Registration & Licensing</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Registration Number"
            type="text"
            placeholder="e.g., NDoH-REG-2024-XXX"
            value={formData?.registration_number || ''}
            onChange={(e) => onChange('registration_number', e?.target?.value)}
            disabled={readOnly}
          />
          <Input
            label="License Number"
            type="text"
            placeholder="Enter license number"
            value={formData?.license_number || ''}
            onChange={(e) => onChange('license_number', e?.target?.value)}
            disabled={readOnly}
          />
        </div>
      </div>

      {/* Data Quality / Verification (Read-only display) */}
      {formData?.id && (
        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Data Quality Status</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Last Verified:</span>
              <p className="font-medium">
                {formData?.last_verified_date
                  ? new Date(formData.last_verified_date).toLocaleDateString()
                  : <span className="text-orange-500">Never verified</span>}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Verification Method:</span>
              <p className="font-medium capitalize">{formData?.verification_method?.replace('_', ' ') || 'N/A'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Quality Score:</span>
              <p className="font-medium">
                {formData?.quality_score
                  ? `${formData.quality_score}%`
                  : <span className="text-muted-foreground">Not scored</span>}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Description */}
      <Input
        label="Description / Notes"
        type="text"
        placeholder="Brief description of the facility, catchment area, or special notes"
        value={formData?.description || ''}
        onChange={(e) => onChange('description', e?.target?.value)}
        disabled={readOnly}
      />
    </div>
  );
};

export default BasicInfoForm;