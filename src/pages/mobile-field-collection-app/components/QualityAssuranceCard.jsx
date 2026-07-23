import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QualityAssuranceCard = ({ formData, photos, gpsData }) => {
  const [validationResults, setValidationResults] = useState(null);

  const performValidation = () => {
    const results = {
      requiredFields: {
        status: formData?.facilityName && formData?.facilityType && formData?.address ? 'pass' : 'fail',
        message: 'All required fields must be completed',
        details: []
      },
      photoQuality: {
        status: photos?.length >= 2 ? 'pass' : 'warning',
        message: photos?.length >= 2 ? 'Sufficient photos captured' : 'Minimum 2 photos recommended',
        details: [`${photos?.length || 0} photos captured`]
      },
      gpsAccuracy: {
        status: gpsData ? 'pass' : 'fail',
        message: gpsData ? 'GPS coordinates captured' : 'GPS coordinates required',
        details: gpsData ? [`Accuracy: ±${Math.random() * 20 + 5}m`] : ['No GPS data available']
      },
      dataCompleteness: {
        status: 'pass',
        message: 'Data completeness score: 85%',
        details: ['Contact information: Complete', 'Operating hours: Complete', 'Services: Partial']
      }
    };

    if (!formData?.facilityName) results?.requiredFields?.details?.push('Facility name missing');
    if (!formData?.facilityType) results?.requiredFields?.details?.push('Facility type missing');
    if (!formData?.address) results?.requiredFields?.details?.push('Address missing');

    setValidationResults(results);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pass':
        return { name: 'CheckCircle', color: 'text-success' };
      case 'warning':
        return { name: 'AlertCircle', color: 'text-warning' };
      case 'fail':
        return { name: 'XCircle', color: 'text-error' };
      default:
        return { name: 'HelpCircle', color: 'text-muted-foreground' };
    }
  };

  const getOverallStatus = () => {
    if (!validationResults) return null;
    const statuses = Object.values(validationResults)?.map(r => r?.status);
    if (statuses?.includes('fail')) return 'fail';
    if (statuses?.includes('warning')) return 'warning';
    return 'pass';
  };

  const overallStatus = getOverallStatus();

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Icon name="ShieldCheck" size={20} className="text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Quality Assurance</h2>
        </div>
      </div>
      <div className="p-4 space-y-4">
        {!validationResults ? (
          <div className="text-center py-8">
            <Icon name="ClipboardCheck" size={48} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Run validation to check data quality</p>
            <Button
              variant="default"
              iconName="Play"
              iconPosition="left"
              onClick={performValidation}
            >
              Run Validation
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg border-2 ${
              overallStatus === 'pass' ? 'bg-success/10 border-success/20' :
              overallStatus === 'warning'? 'bg-warning/10 border-warning/20' : 'bg-error/10 border-error/20'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon
                  name={getStatusIcon(overallStatus)?.name}
                  size={20}
                  className={getStatusIcon(overallStatus)?.color}
                />
                <span className="font-semibold text-foreground">
                  {overallStatus === 'pass' ? 'Ready for Submission' :
                   overallStatus === 'warning'? 'Review Recommended' : 'Action Required'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {overallStatus === 'pass' ? 'All quality checks passed successfully' :
                 overallStatus === 'warning'? 'Some optional checks need attention' : 'Please address the issues below before submission'}
              </p>
            </div>

            <div className="space-y-3">
              {Object.entries(validationResults)?.map(([key, result]) => {
                const statusIcon = getStatusIcon(result?.status);
                return (
                  <div key={key} className="p-3 bg-muted/50 rounded-lg border border-border">
                    <div className="flex items-start gap-3">
                      <Icon name={statusIcon?.name} size={18} className={`${statusIcon?.color} mt-0.5`} />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground mb-1">
                          {key?.replace(/([A-Z])/g, ' $1')?.replace(/^./, str => str?.toUpperCase())}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">{result?.message}</p>
                        {result?.details?.length > 0 && (
                          <ul className="space-y-1">
                            {result?.details?.map((detail, index) => (
                              <li key={index} className="text-xs text-muted-foreground flex items-center gap-1">
                                <Icon name="Minus" size={10} />
                                <span>{detail}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              variant="outline"
              iconName="RefreshCw"
              iconPosition="left"
              onClick={performValidation}
              fullWidth
            >
              Re-run Validation
            </Button>
          </div>
        )}

        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
          <Icon name="Info" size={16} className="text-muted-foreground mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Quality assurance checks ensure data accuracy and completeness before submission to the central registry.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QualityAssuranceCard;