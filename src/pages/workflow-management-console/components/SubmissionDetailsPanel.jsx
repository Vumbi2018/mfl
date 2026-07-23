import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';


const SubmissionDetailsPanel = ({ task, onApprove, onReject, onComment, onEdit }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [commentText, setCommentText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-card border border-border rounded-lg p-8">
        <Icon name="FileText" size={48} className="text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-foreground mb-2">No Submission Selected</p>
        <p className="text-sm text-muted-foreground text-center">
          Select a submission from the queue to view details and take action
        </p>
      </div>
    );
  }

  const commentTemplates = [
    { value: '', label: 'Select a template...' },
    { value: 'incomplete', label: 'Incomplete Information - Please provide missing facility details including contact information and service offerings.' },
    { value: 'coordinates', label: 'GPS Coordinates Issue - The provided coordinates appear incorrect. Please verify the exact location using the map editor.' },
    { value: 'duplicate', label: 'Potential Duplicate - This facility may already exist in the system. Please verify before resubmitting.' },
    { value: 'documentation', label: 'Missing Documentation - Required supporting documents are missing. Please upload facility registration and operational licenses.' }
  ];

  const handleTemplateSelect = (e) => {
    const template = e?.target?.value;
    setSelectedTemplate(template);
    setCommentText(template);
  };

  const handleSubmitComment = () => {
    if (commentText?.trim()) {
      onComment(task?.id, commentText);
      setCommentText('');
      setSelectedTemplate('');
    }
  };

  const tabs = [
    { id: 'details', label: 'Details', icon: 'FileText' },
    { id: 'comments', label: 'Comments', icon: 'MessageSquare', badge: task?.comments?.length },
    { id: 'history', label: 'History', icon: 'History', badge: task?.changeHistory?.length },
    { id: 'validation', label: 'Validation', icon: 'CheckCircle2' }
  ];

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-lg">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-border">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
            <Image
              src={task?.facilityImage}
              alt={task?.facilityImageAlt}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-1">{task?.facilityName}</h3>
            <p className="text-sm text-muted-foreground mb-2">{task?.location}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                <Icon name="Building2" size={12} />
                {task?.facilityType}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                <Icon name="User" size={12} />
                {task?.submitter}
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          iconName="Edit"
          onClick={() => onEdit(task?.id)}
          className="ml-2"
        >
          Edit
        </Button>
      </div>
      {/* Tabs */}
      <div className="flex items-center gap-1 px-4 pt-4 border-b border-border">
        {tabs?.map((tab) => (
          <button
            key={tab?.id}
            onClick={() => setActiveTab(tab?.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${activeTab === tab?.id
              ? 'bg-background text-foreground border-t border-x border-border'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
          >
            <Icon name={tab?.icon} size={16} />
            {tab?.label}
            {tab?.badge > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                {tab?.badge}
              </span>
            )}
          </button>
        ))}
      </div>
      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {activeTab === 'details' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Submission ID</label>
                <p className="text-sm text-foreground mt-1">{task?.id}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Submission Date</label>
                <p className="text-sm text-foreground mt-1">{task?.submissionDate}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority Level</label>
                <p className="text-sm text-foreground mt-1 capitalize">{task?.priority}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Days Remaining</label>
                <p className="text-sm text-foreground mt-1">{task?.daysRemaining} days</p>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Facility Information</label>
              <div className="mt-3 space-y-3">
                <div className="flex items-start gap-2">
                  <Icon name="MapPin" size={16} className="text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Location</p>
                    <p className="text-sm text-muted-foreground">{task?.fullAddress}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Icon name="Phone" size={16} className="text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Contact</p>
                    <p className="text-sm text-muted-foreground">{task?.contactPhone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Icon name="Mail" size={16} className="text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Email</p>
                    <p className="text-sm text-muted-foreground">{task?.contactEmail}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">GPS Coordinates</label>
              <div className="mt-3 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Icon name="Navigation" size={16} className="text-primary" />
                  <span className="text-sm text-foreground font-mono">{task?.coordinates?.lat}, {task?.coordinates?.lng}</span>
                </div>
                <button className="text-sm text-primary hover:underline">View on Map</button>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Digital Verification</label>
              <div className="mt-3 flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                <div className="bg-white p-1 rounded border border-border/50">
                  <QRCodeSVG
                    value={`${window.location.protocol}//${window.location.hostname === 'localhost' ? '192.168.1.195' : window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/verify/${task?.id}`}
                    size={64}
                    level="M"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Scan Field Record</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Verify submission data on mobile device
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="space-y-4">
            {task?.comments?.map((comment, index) => (
              <div key={index} className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-muted">
                  <Image
                    src={comment?.authorAvatar}
                    alt={comment?.authorAvatarAlt}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{comment?.author}</span>
                    <span className="text-xs text-muted-foreground">{comment?.timestamp}</span>
                  </div>
                  <p className="text-sm text-foreground">{comment?.text}</p>
                </div>
              </div>
            ))}

            <div className="pt-4 border-t border-border space-y-3">
              <select
                value={selectedTemplate}
                onChange={handleTemplateSelect}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-foreground"
              >
                {commentTemplates?.map((template) => (
                  <option key={template?.value} value={template?.value}>
                    {template?.label}
                  </option>
                ))}
              </select>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e?.target?.value)}
                placeholder="Add a comment..."
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md text-foreground resize-none"
                rows={4}
              />
              <Button
                onClick={handleSubmitComment}
                disabled={!commentText?.trim()}
                iconName="Send"
                iconPosition="right"
              >
                Post Comment
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {task?.changeHistory?.map((change, index) => (
              <div key={index} className="flex gap-3 p-3 border-l-2 border-primary">
                <Icon name={change?.icon} size={16} className="text-primary mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{change?.action}</p>
                  <p className="text-xs text-muted-foreground mt-1">{change?.user} • {change?.timestamp}</p>
                  {change?.details && (
                    <p className="text-sm text-muted-foreground mt-2">{change?.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'validation' && (
          <div className="space-y-4">
            {task?.validationResults?.map((result, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                <Icon
                  name={result?.status === 'passed' ? 'CheckCircle2' : result?.status === 'warning' ? 'AlertCircle' : 'XCircle'}
                  size={20}
                  className={result?.status === 'passed' ? 'text-success' : result?.status === 'warning' ? 'text-warning' : 'text-error'}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{result?.check}</p>
                  <p className="text-sm text-muted-foreground mt-1">{result?.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Actions */}
      <div className="flex items-center gap-3 p-4 border-t border-border bg-muted/30">
        <Button
          variant="outline"
          onClick={() => onReject(task?.id)}
          iconName="XCircle"
          iconPosition="left"
          className="flex-1"
        >
          Reject
        </Button>
        <Button
          variant="success"
          onClick={() => onApprove(task?.id)}
          iconName="CheckCircle"
          iconPosition="left"
          className="flex-1"
        >
          Approve
        </Button>
      </div>
    </div>
  );
};

export default SubmissionDetailsPanel;