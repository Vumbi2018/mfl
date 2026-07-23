import React from 'react';
import Icon from '../../../components/AppIcon';

const FacilityDetailsSummary = ({ facility }) => {
    if (!facility?.id) return null;

    const getStatusColor = (status) => {
        const statusLower = status?.toLowerCase() || '';
        if (statusLower.includes('operational') || statusLower === 'active') return 'bg-success/10 text-success';
        if (statusLower.includes('closed') || statusLower === 'inactive') return 'bg-error/10 text-error';
        if (statusLower.includes('construction') || statusLower.includes('pending')) return 'bg-warning/10 text-warning';
        return 'bg-muted text-muted-foreground';
    };

    const getWorkflowBadge = (status) => {
        const statusMap = {
            'DRAFT': { color: 'bg-gray-100 text-gray-600', label: 'Draft' },
            'PENDING_REVIEW': { color: 'bg-amber-100 text-amber-700', label: 'Pending Review' },
            'APPROVED': { color: 'bg-green-100 text-green-700', label: 'Approved' },
            'REJECTED': { color: 'bg-red-100 text-red-700', label: 'Rejected' }
        };
        return statusMap[status] || statusMap['DRAFT'];
    };

    const workflowBadge = getWorkflowBadge(facility?.workflow_status);

    return (
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                    <Icon name="Hospital" size={20} className="text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-primary font-medium uppercase tracking-wide mb-1">
                        Editing Facility
                    </p>
                    <h2 className="text-lg font-bold text-foreground truncate" title={facility?.name}>
                        {facility?.name || 'Unnamed Facility'}
                    </h2>
                </div>
            </div>

            <div className="mt-4 space-y-2">
                {/* Facility Code */}
                {facility?.facility_code && (
                    <div className="flex items-center gap-2 text-sm">
                        <Icon name="Hash" size={14} className="text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Code:</span>
                        <span className="font-mono font-medium text-foreground">{facility.facility_code}</span>
                    </div>
                )}

                {/* Facility Type */}
                {facility?.facility_type && (
                    <div className="flex items-center gap-2 text-sm">
                        <Icon name="Building" size={14} className="text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium text-foreground truncate">{facility.facility_type}</span>
                    </div>
                )}

                {/* Location */}
                {(facility?.province || facility?.district) && (
                    <div className="flex items-center gap-2 text-sm">
                        <Icon name="MapPin" size={14} className="text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-medium text-foreground truncate">
                            {[facility?.district, facility?.province].filter(Boolean).join(', ')}
                        </span>
                    </div>
                )}

                {/* Operational Status */}
                {facility?.operational_status && (
                    <div className="flex items-center gap-2 text-sm">
                        <Icon name="Activity" size={14} className="text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Status:</span>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(facility.operational_status)}`}>
                            {facility.operational_status}
                        </span>
                    </div>
                )}
            </div>

            {/* Workflow Status Badge */}
            <div className="mt-4 pt-3 border-t border-primary/20 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Workflow Status</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-md ${workflowBadge.color}`}>
                    {workflowBadge.label}
                </span>
            </div>
        </div>
    );
};

export default FacilityDetailsSummary;
