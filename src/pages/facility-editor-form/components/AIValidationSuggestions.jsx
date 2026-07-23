import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const AIValidationSuggestions = ({ formData, onApply }) => {
  const [suggestions, setSuggestions] = useState([]);

  // Run validation whenever formData changes
  React.useEffect(() => {
    if (!formData) return;

    const newSuggestions = [];
    let idCounter = 1;

    const tenantCode = (localStorage.getItem('tenant_code') || 'zambia').toLowerCase();
    const isZambia = tenantCode === 'zambia';

    // RULE 1: GPS Check
    if (formData.latitude && formData.longitude) {
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);

      const isValidBounds = isZambia 
        ? (lat <= -8.0 && lat >= -18.0 && lng >= 21.0 && lng <= 34.0)
        : (lat <= 0 && lat >= -12.0 && lng >= 140.0 && lng <= 160.0);

      if (!isValidBounds) {
        newSuggestions.push({
          id: idCounter++,
          type: 'error',
          field: 'GPS Coordinates',
          message: `Coordinates appear to be outside ${isZambia ? 'Zambia' : 'Papua New Guinea'} boundaries.`,
          suggestion: 'Verify location on map picker',
          actionType: 'OPEN_MAPS', // Custom action key
          confidence: 99,
          dismissed: false
        });
      }
    } else {
      newSuggestions.push({
        id: idCounter++,
        type: 'warning',
        field: 'GPS Coordinates',
        message: 'Missing location data',
        suggestion: `Use default ${isZambia ? 'Lusaka / Central Zambia' : 'Port Moresby'} coordinates`,
        actionType: 'SET_DEFAULT_GPS',
        payload: isZambia 
          ? { latitude: -15.4167, longitude: 28.2833 }
          : { latitude: -9.44, longitude: 147.18 },
        confidence: 100,
        dismissed: false
      });
    }


    // RULE 2: Contact Info
    if (!formData.emergency_contact && !formData.general_contact) {
      newSuggestions.push({
        id: idCounter++,
        type: 'warning',
        field: 'Contact Info',
        message: 'No contact number provided',
        suggestion: 'Mark as pending contact verification',
        actionType: 'SET_PENDING_CONTACT',
        confidence: 90,
        dismissed: false
      });
    }

    // RULE 4: Operational Status
    if (formData.operational_status === 'operational' && (!formData.weekday_hours)) {
      newSuggestions.push({
        id: idCounter++,
        type: 'info',
        field: 'Operating Hours',
        message: 'Facility is marked operational but hours are missing',
        suggestion: 'Set standard 8am-4pm hours',
        actionType: 'SET_STANDARD_HOURS',
        confidence: 75,
        dismissed: false
      });
    }

    setSuggestions(newSuggestions);
  }, [formData]);

  const handleDismiss = (id) => {
    setSuggestions(suggestions?.map(s =>
      s?.id === id ? { ...s, dismissed: true } : s
    ));
  };

  const handleApply = (suggestion) => {
    if (!onApply || !suggestion.actionType) return;

    if (suggestion.actionType === 'SET_DEFAULT_GPS') {
      onApply('latitude', suggestion.payload.latitude);
      onApply('longitude', suggestion.payload.longitude);
    } else if (suggestion.actionType === 'SET_STANDARD_HOURS') {
      onApply('weekday_hours', '08:00 - 16:00');
      onApply('weekend_hours', 'Closed');
    } else if (suggestion.actionType === 'OPEN_MAPS') {
      window.open(`https://www.google.com/maps/@?api=1&map_action=map&center=${formData.latitude},${formData.longitude}&zoom=6`, '_blank');
    }

    // Auto-dismiss after applying
    handleDismiss(suggestion.id);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'error':
        return 'AlertCircle';
      case 'warning':
        return 'AlertTriangle';
      case 'success':
        return 'CheckCircle';
      default:
        return 'Info';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'error':
        return 'text-error';
      case 'warning':
        return 'text-warning';
      case 'success':
        return 'text-success';
      default:
        return 'text-primary';
    }
  };

  const activeSuggestions = suggestions?.filter(s => !s?.dismissed);

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Icon name="Sparkles" size={16} />
          AI Validation
        </h3>
        <span className="text-xs text-muted-foreground">{activeSuggestions?.length} active</span>
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
        {activeSuggestions?.map((suggestion) => (
          <div
            key={suggestion?.id}
            className="p-3 rounded-md border border-border bg-muted/30"
          >
            <div className="flex items-start gap-2 mb-2">
              <Icon
                name={getTypeIcon(suggestion?.type)}
                size={16}
                className={`${getTypeColor(suggestion?.type)} mt-0.5`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground mb-1">{suggestion?.field}</p>
                <p className="text-xs text-muted-foreground mb-2">{suggestion?.message}</p>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 bg-background rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full ${suggestion?.confidence >= 90 ? 'bg-success' :
                        suggestion?.confidence >= 70 ? 'bg-warning' : 'bg-error'
                        }`}
                      style={{ width: `${suggestion?.confidence}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{suggestion?.confidence}%</span>
                </div>
                <p className="text-xs text-primary mb-3">{suggestion?.suggestion}</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="xs"
                    iconName="Check"
                    iconPosition="left"
                    onClick={() => handleApply(suggestion)}
                  >
                    Apply
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    iconName="X"
                    iconPosition="left"
                    onClick={() => handleDismiss(suggestion?.id)}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {activeSuggestions?.length === 0 && (
        <div className="text-center py-8">
          <Icon name="CheckCircle" size={32} className="text-success mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">All validations passed</p>
        </div>
      )}
    </div>
  );
};

export default AIValidationSuggestions;