import React, { useEffect, useState, useMemo } from 'react';
import Input from '../../../components/ui/Input';
import { Checkbox, CheckboxGroup } from '../../../components/ui/Checkbox';
import api from '../../../utils/api';

const ServicesCapacityForm = ({ formData, onChange, readOnly }) => {
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState({});

  // Fetch WHO-aligned service types from database
  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        const response = await api.get('/reference/service-types');
        setServiceTypes(response.data);
        // Expand all categories by default
        const categories = [...new Set(response.data.map(s => s.category))];
        const expanded = {};
        categories.forEach(c => expanded[c] = true);
        setExpandedCategories(expanded);
      } catch (err) {
        console.error('Failed to fetch service types:', err);
        // Fallback to basic categories
        setServiceTypes([
          { code: 'emergency', category: 'Emergency Services', name: 'Emergency Services' },
          { code: 'outpatient', category: 'General', name: 'Outpatient Services' },
          { code: 'inpatient', category: 'General', name: 'Inpatient Services' },
          { code: 'surgery', category: 'Surgical Services', name: 'Surgical Services' },
          { code: 'laboratory', category: 'Diagnostic Services', name: 'Laboratory Services' },
          { code: 'pharmacy', category: 'Support Services', name: 'Pharmacy Services' }
        ]);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServiceTypes();
  }, []);

  // Group services by category for display
  const servicesByCategory = useMemo(() => {
    const grouped = {};
    serviceTypes.forEach(svc => {
      if (!grouped[svc.category]) {
        grouped[svc.category] = [];
      }
      grouped[svc.category].push(svc);
    });
    return grouped;
  }, [serviceTypes]);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const isServiceSelected = (serviceCode) => {
    const services = formData?.services || [];
    return services.includes(serviceCode);
  };

  const handleServiceToggle = (serviceCode, checked) => {
    if (readOnly) return;
    const currentServices = formData?.services || [];
    const newServices = checked
      ? [...currentServices, serviceCode]
      : currentServices.filter(s => s !== serviceCode);
    onChange('services', newServices);
  };

  return (
    <div className="space-y-6">
      {/* Bed Capacity */}
      <div className="border-b pb-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Bed Capacity</h3>
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Total Beds"
            type="number"
            placeholder="0"
            value={formData?.total_beds ?? ''}
            onChange={(e) => onChange('total_beds', e?.target?.value)}
            disabled={readOnly}
          />
          <Input
            label="ICU Beds"
            type="number"
            placeholder="0"
            value={formData?.icu_beds ?? ''}
            onChange={(e) => onChange('icu_beds', e?.target?.value)}
            disabled={readOnly}
          />
          <Input
            label="Emergency Beds"
            type="number"
            placeholder="0"
            value={formData?.emergency_beds ?? ''}
            onChange={(e) => onChange('emergency_beds', e?.target?.value)}
            disabled={readOnly}
          />
        </div>
      </div>

      {/* Infrastructure */}
      <div className="border-b pb-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Infrastructure</h3>
        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Operating Theaters"
            type="number"
            placeholder="0"
            value={formData?.operating_theaters ?? ''}
            onChange={(e) => onChange('operating_theaters', e?.target?.value)}
            disabled={readOnly}
          />
          <Input
            label="Outpatient Rooms"
            type="number"
            placeholder="0"
            value={formData?.outpatient_rooms ?? ''}
            onChange={(e) => onChange('outpatient_rooms', e?.target?.value)}
            disabled={readOnly}
          />
          <Input
            label="Consultation Rooms"
            type="number"
            placeholder="0"
            value={formData?.consultation_rooms ?? ''}
            onChange={(e) => onChange('consultation_rooms', e?.target?.value)}
            disabled={readOnly}
          />
        </div>
      </div>

      {/* WHO-Aligned Health Services */}
      <div className="border border-border rounded-lg p-4 bg-muted/30">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-foreground">Available Services (WHO Health Service Taxonomy)</h4>
          {loadingServices && <span className="text-xs text-muted-foreground">Loading...</span>}
        </div>

        {Object.keys(servicesByCategory).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(servicesByCategory).map(([category, services]) => (
              <div key={category} className="border border-border/50 rounded-md overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-muted/50 hover:bg-muted text-left text-sm font-medium"
                >
                  <span>{category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {services.filter(s => isServiceSelected(s.code)).length}/{services.length} selected
                    </span>
                    <span className="text-muted-foreground">
                      {expandedCategories[category] ? '▼' : '▶'}
                    </span>
                  </div>
                </button>

                {expandedCategories[category] && (
                  <div className="p-3 grid grid-cols-2 gap-2">
                    <CheckboxGroup>
                      {services.map((service) => (
                        <Checkbox
                          key={service.code}
                          label={
                            <span className="flex items-center gap-1">
                              {service.name}
                              {service.requires_certification && (
                                <span className="text-[10px] text-orange-500" title="Requires certification">⚕</span>
                              )}
                            </span>
                          }
                          checked={isServiceSelected(service.code)}
                          onChange={(e) => handleServiceToggle(service.code, e?.target?.checked)}
                          disabled={readOnly}
                        />
                      ))}
                    </CheckboxGroup>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {loadingServices ? 'Loading service taxonomy...' : 'No services available'}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-3">
          ⓘ Services are categorized according to WHO Essential Health Services packages (RMNCAH, CD, NCD, SURG, DIAG, SUPP)
        </p>
      </div>

      {/* Operating Hours */}
      <div className="border-b pb-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Operating Hours</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Weekday Hours"
            type="text"
            placeholder="e.g., 8:00 AM - 6:00 PM"
            value={formData?.weekday_hours || ''}
            onChange={(e) => onChange('weekday_hours', e?.target?.value)}
            disabled={readOnly}
          />
          <Input
            label="Weekend Hours"
            type="text"
            placeholder="e.g., 9:00 AM - 5:00 PM or Closed"
            value={formData?.weekend_hours || ''}
            onChange={(e) => onChange('weekend_hours', e?.target?.value)}
            disabled={readOnly}
          />
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Contact Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Emergency Contact"
            type="tel"
            placeholder="+675 XXXX XXXX"
            value={formData?.emergency_contact || ''}
            onChange={(e) => onChange('emergency_contact', e?.target?.value)}
            disabled={readOnly}
          />
          <Input
            label="General Contact"
            type="tel"
            placeholder="+675 XXXX XXXX"
            value={formData?.general_contact || ''}
            onChange={(e) => onChange('general_contact', e?.target?.value)}
            disabled={readOnly}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="facility@example.com"
            value={formData?.contact_email || ''}
            onChange={(e) => onChange('contact_email', e?.target?.value)}
            disabled={readOnly}
          />
          <Input
            label="Website"
            type="url"
            placeholder="https://example.com"
            value={formData?.website || ''}
            onChange={(e) => onChange('website', e?.target?.value)}
            disabled={readOnly}
          />
        </div>
      </div>
    </div>
  );
};

export default ServicesCapacityForm;