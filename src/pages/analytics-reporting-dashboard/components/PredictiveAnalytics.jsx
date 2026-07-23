import React from 'react';
import Icon from '../../../components/AppIcon';

const PredictiveAnalytics = ({ predictions }) => {
  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'text-success';
    if (confidence >= 60) return 'text-warning';
    return 'text-error';
  };

  const getConfidenceBg = (confidence) => {
    if (confidence >= 80) return 'bg-success/10';
    if (confidence >= 60) return 'bg-warning/10';
    return 'bg-error/10';
  };

  return (
    <div className="card-elevated p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Predictive Analytics</h3>
          <p className="text-sm text-muted-foreground mt-1">AI-powered forecasts and recommendations</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-md">
          <Icon name="Sparkles" size={16} />
          <span className="text-sm font-medium">AI Insights</span>
        </div>
      </div>
      <div className="space-y-4">
        {(!predictions || predictions.length === 0) ? (
          <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-lg">
            <Icon name="Sparkles" size={24} className="mx-auto mb-2 opacity-50" />
            <p>No predictive insights available yet.</p>
            <p className="text-xs mt-1">More historical data is needed.</p>
          </div>
        ) : (
          predictions?.map((prediction) => (
            <div
              key={prediction?.id}
              className={`p-4 rounded-lg border border-border hover:border-primary transition-colors ${prediction.onClick ? 'cursor-pointer hover:bg-muted/50' : ''}`}
              onClick={() => prediction.onClick && prediction.onClick()}
              role={prediction.onClick ? "button" : undefined}
              tabIndex={prediction.onClick ? 0 : undefined}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getConfidenceBg(prediction?.confidence)}`}>
                    <Icon name={prediction?.icon} size={20} className={getConfidenceColor(prediction?.confidence)} />
                  </div>
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      {prediction?.title}
                      {prediction.onClick && <Icon name="ExternalLink" size={12} className="text-muted-foreground" />}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">{prediction?.description}</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceBg(prediction?.confidence)} ${getConfidenceColor(prediction?.confidence)}`}>
                  {prediction?.confidence}% confidence
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Predicted Impact:</span>
                  <span className="font-medium text-foreground">{prediction?.impact}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Timeline:</span>
                  <span className="font-medium text-foreground">{prediction?.timeline}</span>
                </div>
              </div>

              {prediction?.recommendations && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs font-medium text-foreground mb-2">Recommended Actions:</p>
                  <ul className="space-y-1">
                    {prediction?.recommendations?.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Icon name="ArrowRight" size={12} className="mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PredictiveAnalytics;