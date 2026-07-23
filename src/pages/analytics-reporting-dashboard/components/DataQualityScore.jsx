import React from 'react';
import Icon from '../../../components/AppIcon';

const DataQualityScore = ({ overallScore, categories, onRefresh, onViewDetails }) => {
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-success';
    if (score >= 70) return 'text-warning';
    return 'text-error';
  };

  const getScoreBgColor = (score) => {
    if (score >= 90) return 'bg-success/10';
    if (score >= 70) return 'bg-warning/10';
    return 'bg-error/10';
  };

  return (
    <div className="card-elevated p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Data Quality Score</h3>
          <p className="text-sm text-muted-foreground mt-1">Completeness and accuracy metrics</p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-md transition-colors"
        >
          <Icon name="RefreshCw" size={16} />
          Refresh
        </button>
      </div>
      <div className="flex items-center justify-center mb-8">
        <div className={`relative w-40 h-40 rounded-full flex items-center justify-center ${getScoreBgColor(overallScore)}`}>
          <div className="text-center">
            <div className={`text-5xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Overall Score</div>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {(!categories || categories.length === 0) ? (
          <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-lg">
            <Icon name="Database" size={24} className="mx-auto mb-2 opacity-50" />
            <p>No data quality report available.</p>
          </div>
        ) : (
          categories?.map((category) => (
            <div
              key={category?.id}
              className="space-y-2 cursor-pointer group"
              onClick={() => onViewDetails && onViewDetails(category.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name={category?.icon} size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{category?.name}</span>
                </div>
                <span className={`text-sm font-semibold ${getScoreColor(category?.score)}`}>
                  {category?.score}%
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${category?.score >= 90 ? 'bg-success' :
                    category?.score >= 70 ? 'bg-warning' : 'bg-error'
                    }`}
                  style={{ width: `${category?.score}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{category?.description}</p>
            </div>
          ))
        )}
      </div>
      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Last validation: Just now</span>
          <button
            onClick={() => onViewDetails && onViewDetails('overall')}
            className="text-sm font-medium text-primary hover:underline"
          >
            View Detailed Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataQualityScore;