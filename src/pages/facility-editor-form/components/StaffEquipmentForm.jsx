import React from 'react';
import Input from '../../../components/ui/Input';


const StaffEquipmentForm = ({ formData, onChange, readOnly }) => {
  const equipmentCategories = [
    { value: 'diagnostic', label: 'Diagnostic Equipment' },
    { value: 'surgical', label: 'Surgical Equipment' },
    { value: 'monitoring', label: 'Monitoring Equipment' },
    { value: 'laboratory', label: 'Laboratory Equipment' }
  ];

  return (
    <div className="space-y-6">
      <div className="border border-border rounded-lg p-4 bg-muted/30">
        <h4 className="text-sm font-semibold text-foreground mb-4">Medical Staff</h4>
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Doctors"
            type="number"
            placeholder="0"
            value={formData?.doctors ?? ''}
            onChange={(e) => onChange('doctors', e?.target?.value)}
            disabled={readOnly}
          />
          <Input
            label="Nurses"
            type="number"
            placeholder="0"
            value={formData?.nurses ?? ''}
            onChange={(e) => onChange('nurses', e?.target?.value)}
            disabled={readOnly}
          />
          <Input
            label="Specialists"
            type="number"
            placeholder="0"
            value={formData?.specialists ?? ''}
            onChange={(e) => onChange('specialists', e?.target?.value)}
            disabled={readOnly}
          />
        </div>
      </div>
      <div className="border border-border rounded-lg p-4 bg-muted/30">
        <h4 className="text-sm font-semibold text-foreground mb-4">Support Staff</h4>
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Technicians"
            type="number"
            placeholder="0"
            value={formData?.technicians ?? ''}
            onChange={(e) => onChange('technicians', e?.target?.value)}
            disabled={readOnly}
          />
          <Input
            label="Pharmacists"
            type="number"
            placeholder="0"
            value={formData?.pharmacists ?? ''}
            onChange={(e) => onChange('pharmacists', e?.target?.value)}
            disabled={readOnly}
          />
          <Input
            label="Administrative Staff"
            type="number"
            placeholder="0"
            value={formData?.admin_staff ?? ''}
            onChange={(e) => onChange('admin_staff', e?.target?.value)}
            disabled={readOnly}
          />
        </div>
      </div>
      <div className="border border-border rounded-lg p-4 bg-muted/30">
        <h4 className="text-sm font-semibold text-foreground mb-4">Major Equipment</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="CT Scanners"
              type="number"
              placeholder="0"
              value={formData?.ct_scanners ?? ''}
              onChange={(e) => onChange('ct_scanners', e?.target?.value)}
              disabled={readOnly}
            />
            <Input
              label="MRI Machines"
              type="number"
              placeholder="0"
              value={formData?.mri_machines ?? ''}
              onChange={(e) => onChange('mri_machines', e?.target?.value)}
              disabled={readOnly}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="X-Ray Machines"
              type="number"
              placeholder="0"
              value={formData?.xray_machines ?? ''}
              onChange={(e) => onChange('xray_machines', e?.target?.value)}
              disabled={readOnly}
            />
            <Input
              label="Ultrasound Machines"
              type="number"
              placeholder="0"
              value={formData?.ultrasound_machines ?? ''}
              onChange={(e) => onChange('ultrasound_machines', e?.target?.value)}
              disabled={readOnly}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ventilators"
              type="number"
              placeholder="0"
              value={formData?.ventilators ?? ''}
              onChange={(e) => onChange('ventilators', e?.target?.value)}
              disabled={readOnly}
            />
            <Input
              label="Dialysis Machines"
              type="number"
              placeholder="0"
              value={formData?.dialysis_machines ?? ''}
              onChange={(e) => onChange('dialysis_machines', e?.target?.value)}
              disabled={readOnly}
            />
          </div>
        </div>
      </div>
      <div className="border border-border rounded-lg p-4 bg-muted/30">
        <h4 className="text-sm font-semibold text-foreground mb-4">Ambulance Services</h4>

        <div className="mb-4">
          <label className="block text-xs font-medium text-foreground mb-1">Has Ambulance?</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="has_ambulance"
                checked={formData?.basic_ambulances > 0 || formData?.advanced_ambulances > 0 || formData?.air_ambulances > 0}
                onChange={() => {
                  if (readOnly) return;
                  if (!formData.basic_ambulances) onChange('basic_ambulances', 1); // Default to 1 basic if setting to Yes
                }}
                disabled={readOnly}
              />
              Yes
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="has_ambulance"
                checked={!formData?.basic_ambulances && !formData?.advanced_ambulances && !formData?.air_ambulances}
                onChange={() => {
                  if (readOnly) return;
                  onChange('basic_ambulances', 0);
                  onChange('advanced_ambulances', 0);
                  onChange('air_ambulances', 0);
                }}
                disabled={readOnly}
              />
              No
            </label>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Basic Ambulances"
            type="number"
            placeholder="0"
            value={formData?.basic_ambulances ?? ''}
            onChange={(e) => onChange('basic_ambulances', e?.target?.value)}
            disabled={readOnly || (!formData?.basic_ambulances && !formData?.advanced_ambulances && !formData?.air_ambulances)}
          />
          <Input
            label="Advanced Ambulances"
            type="number"
            placeholder="0"
            value={formData?.advanced_ambulances ?? ''}
            onChange={(e) => onChange('advanced_ambulances', e?.target?.value)}
            disabled={readOnly || (!formData?.basic_ambulances && !formData?.advanced_ambulances && !formData?.air_ambulances)}
          />
          <Input
            label="Air Ambulances"
            type="number"
            placeholder="0"
            value={formData?.air_ambulances ?? ''}
            onChange={(e) => onChange('air_ambulances', e?.target?.value)}
            disabled={readOnly || (!formData?.basic_ambulances && !formData?.advanced_ambulances && !formData?.air_ambulances)}
          />
        </div>
      </div>
      <Input
        label="Equipment Notes"
        type="text"
        placeholder="Additional equipment information"
        value={formData?.equipment_notes || ''}
        onChange={(e) => onChange('equipment_notes', e?.target?.value)}
        disabled={readOnly}
      />
    </div>
  );
};

export default StaffEquipmentForm;