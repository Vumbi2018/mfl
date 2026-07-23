import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';
import CapitalDistanceCard from './CapitalDistanceCard';

const FacilityDetailPanel = ({ facility, onClose, onHide, onEdit, onViewCertificate, onApprove, onReject, districtRoute, provincialRoute, nationalRoute, capitals, onFlyToCoordinates }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!facility) {
    return (
      <div className="w-96 bg-card border-l border-border h-full flex items-center justify-center">
        <div className="text-center p-6">
          <Icon name="MapPin" size={48} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Select a facility to view details</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'Layout' },
    { id: 'location', label: 'Location', icon: 'Map' },
    { id: 'services', label: 'Services', icon: 'Stethoscope' },
    { id: 'staffing', label: 'Staff & Equip', icon: 'Users' },
  ];

  const getStatusBadge = (status) => {
    const badges = {
      approved: { color: 'success', icon: 'CheckCircle', label: 'Approved' },
      operational: { color: 'success', icon: 'CheckCircle', label: 'Operational' },
      pending: { color: 'warning', icon: 'Clock', label: 'Pending Review' },
      closed: { color: 'error', icon: 'XCircle', label: 'Closed' },
      rejected: { color: 'muted', icon: 'XCircle', label: 'Rejected' },
      default: { color: 'primary', icon: 'Info', label: status || 'Unknown' }
    };
    const badge = badges[status?.toLowerCase()] || badges.default;
    return (
      <div className={`workflow-badge ${badge.color}`}>
        <Icon name={badge.icon} size={14} />
        <span>{badge.label}</span>
      </div>
    );
  };

  return (
    <div className="w-96 bg-card border-l border-border h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between shrink-0 bg-card z-10">
        <div>
          <h2 className="font-semibold text-foreground truncate max-w-[250px]" title={facility.name}>
            {facility.name}
          </h2>
          <p className="text-xs text-muted-foreground">{facility.type} • {facility.code}</p>
        </div>
        <div className="flex items-center gap-1">
          {onHide && (
            <button
              onClick={onHide}
              className="p-2 rounded-md hover:bg-muted transition-colors"
              title="Hide Panel"
            >
              <Icon name="ChevronRight" size={20} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-error"
            title="Close and Clear Selection"
          >
            <Icon name="X" size={20} />
          </button>
        </div>
      </div>

      {/* Banner & Status */}
      <div className="relative h-40 overflow-hidden shrink-0">
        <Image
          src={facility.image}
          alt={facility.name}
          className="w-full h-full object-cover"
          fallbackSrc="/assets/images/facility_placeholder.png"
        />
        <div className="absolute top-3 right-3">
          {getStatusBadge(facility.operational_status)}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
          <p className="text-white text-sm font-medium flex items-center gap-1.5">
            <Icon name="MapPin" size={14} />
            {facility.district || 'Unknown District'}, {facility.region || 'Unknown Region'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border shrink-0 overflow-x-auto scrollbar-none bg-muted/30">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
                            flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium border-b-2 transition-all min-w-[80px]
                            ${activeTab === tab.id
                ? 'border-primary text-primary bg-primary/5'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted'
              }
                        `}
          >
            <Icon name={tab.icon} size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {activeTab === 'overview' && (
          <div className="space-y-5 animate-fade-in">
            {/* Summary Card */}
            <div className="bg-muted/40 p-4 rounded-lg border border-border/50 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Ownership</span>
                  <span className="text-sm font-medium text-foreground">{facility.ownership || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Date Opened</span>
                  <span className="text-sm font-medium text-foreground">
                    {facility.date_established ? new Date(facility.date_established).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Key Statistics</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-1.5 text-primary">
                    <Icon name="Bed" size={16} />
                    <span className="text-xs font-semibold">Total Beds</span>
                  </div>
                  <span className="text-lg font-bold text-foreground">{facility.total_beds || 0}</span>
                </div>
                <div className="p-3 bg-muted rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-1.5 text-primary">
                    <Icon name="Activity" size={16} />
                    <span className="text-xs font-semibold">Services</span>
                  </div>
                  <span className="text-lg font-bold text-foreground">{facility.services?.length || 0}</span>
                </div>
              </div>
            </div>

            {/* Operating Hours */}
            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Operating Hours</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Weekdays:</span>
                  <span className="font-medium">{facility.weekday_hours || 'Not specified'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Weekends:</span>
                  <span className="font-medium">{facility.weekend_hours || 'Not specified'}</span>
                </div>
              </div>
            </div>

            {/* Digital Link */}
            <div className="pt-2 border-t border-border/50">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Digital Record</h4>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-border/50 shadow-sm">
                <div className="bg-white p-1 rounded border border-gray-100">
                  <QRCodeSVG
                    value={`${window.location.protocol}//${window.location.hostname === 'localhost' ? '192.168.1.195' : window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/verify/${facility.id}`}
                    size={64}
                    level="M"
                  />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Scan to Verify</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                    Instant access to full FHIR-compliant facility data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'location' && (
          <div className="space-y-5 animate-fade-in">
            {/* Hierarchy */}
            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 dark:bg-blue-900/10 dark:border-blue-800">
              <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">Administrative Location</h4>
              <div className="space-y-3 relative">
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-white border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                    <span className="text-xs font-bold">R</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground font-semibold">Region</span>
                    <p className="text-sm font-medium text-foreground">{facility.region || 'Unknown'}</p>
                  </div>
                </div>
                <div className="w-px h-4 bg-blue-200 ml-4 -my-1"></div>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-white border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                    <span className="text-xs font-bold">P</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground font-semibold">Province</span>
                    <p className="text-sm font-medium text-foreground">{facility.province || 'Unknown'}</p>
                  </div>
                </div>
                <div className="w-px h-4 bg-blue-200 ml-4 -my-1"></div>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-white border border-blue-200 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                    <span className="text-xs font-bold">D</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground font-semibold">District</span>
                    <p className="text-sm font-medium text-foreground">{facility.district || 'Unknown'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Coordinates */}
            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Coordinates</h4>
              <div className="bg-muted p-3 rounded-lg text-sm font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Latitude:</span>
                  <span className="text-foreground">{facility.latitude?.toFixed(6) || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Longitude:</span>
                  <span className="text-foreground">{facility.longitude?.toFixed(6) || 'N/A'}</span>
                </div>
                <div className="flex justify-between pt-2 mt-2 border-t border-border/50">
                  <span className="text-muted-foreground font-sans">Elevation:</span>
                  <span className="text-foreground font-sans">{facility.elevation ? `${facility.elevation}m` : 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Contact Details</h4>
              <div className="space-y-2 text-sm">
                {facility.street_address && (
                  <div className="flex gap-3">
                    <Icon name="MapPin" size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                    <span>
                      {facility.street_address}<br />
                      {facility.city}, {facility.postal_code}
                    </span>
                  </div>
                )}
                {facility.contact_phone && (
                  <div className="flex items-center gap-3">
                    <Icon name="Phone" size={16} className="text-muted-foreground shrink-0" />
                    <a href={`tel:${facility.contact_phone}`} className="hover:text-primary transition-colors">{facility.contact_phone}</a>
                  </div>
                )}
                {facility.contact_email && (
                  <div className="flex items-center gap-3">
                    <Icon name="Mail" size={16} className="text-muted-foreground shrink-0" />
                    <a href={`mailto:${facility.contact_email}`} className="hover:text-primary transition-colors truncate">{facility.contact_email}</a>
                  </div>
                )}
              </div>
            </div>

            {/* Travel Analysis */}
            {capitals && (districtRoute || provincialRoute) && (
              <div className="pt-4 mt-4 border-t border-border/50">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Distance & Travel Analysis</h4>
                <div className="bg-white/50 dark:bg-black/20 rounded-xl overflow-hidden shadow-inner ring-1 ring-black/5 dark:ring-white/10 -mx-4 -mb-4">
                  <CapitalDistanceCard 
                    selectedFacility={facility}
                    capitals={capitals}
                    districtRoute={districtRoute}
                    provincialRoute={provincialRoute}
                    nationalRoute={nationalRoute}
                    onFlyToCoordinates={onFlyToCoordinates}
                    isEmbedded={true}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'services' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-wrap gap-2">
              {facility.services && facility.services.length > 0 ? (
                facility.services.map((service, index) => (
                  <span key={index} className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-xs font-medium border border-primary/20">
                    {service}
                  </span>
                ))
              ) : (
                <p className="text-sm text-muted-foreground w-full text-center py-4">No services listed yet.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'staffing' && (
          <div className="space-y-5 animate-fade-in">
            {/* Staff */}
            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Medical Staff</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Doctors', val: facility.doctors },
                  { label: 'Nurses', val: facility.nurses },
                  { label: 'Specialists', val: facility.specialists },
                  { label: 'Pharmacists', val: facility.pharmacists },
                  { label: 'Technicians', val: facility.technicians },
                  { label: 'Admin', val: facility.admin_staff },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center bg-muted/50 p-2 rounded border border-border/50">
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-semibold">{item.val || 0}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Equipment */}
            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Key Equipment</h4>
              <div className="space-y-1">
                {[
                  { label: 'Ambulances', val: (facility.basic_ambulances || 0) + (facility.advanced_ambulances || 0) },
                  { label: 'Ventilators', val: facility.ventilators },
                  { label: 'X-Ray Machines', val: facility.xray_machines },
                  { label: 'CT Scanners', val: facility.ct_scanners },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between p-2 hover:bg-muted/50 rounded transition-colors text-sm">
                    <span>{item.label}</span>
                    <span className="font-mono font-medium">{item.val || '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Actions */}
      <div className="p-4 border-t border-border shrink-0 bg-muted/10 space-y-2">
        <div className="flex gap-2">
          <Button variant="default" fullWidth iconName="Edit" iconPosition="left" onClick={onEdit}>
            Edit
          </Button>
          <Button variant="outline" fullWidth iconName="FileBadge" iconPosition="left" onClick={onViewCertificate}>
            Certificate
          </Button>
        </div>
        {facility.operational_status === 'Pending' && (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="success" fullWidth iconName="CheckCircle" onClick={onApprove}>Approve</Button>
            <Button variant="destructive" fullWidth iconName="XCircle" onClick={onReject}>Reject</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacilityDetailPanel;