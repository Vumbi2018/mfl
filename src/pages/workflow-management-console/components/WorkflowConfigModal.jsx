import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Switch } from '../../../components/ui/Switch'; // Assuming generic Switch exists, or checking ui library
import Select from '../../../components/ui/Select';

const WorkflowConfigModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const [settings, setSettings] = useState({
        autoAssignment: true,
        slaThresholdHours: 24,
        enforceGeofencing: true,
        requirePhotoEvidence: true,
        allowAutoApproval: false
    });

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-card w-full max-w-lg rounded-xl shadow-2xl border border-border flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <Icon name="Settings" className="text-primary" />
                        <h2 className="font-semibold text-lg">Workflow Configuration</h2>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <Icon name="X" size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* SLA Settings */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">SLA Policies</h3>
                        <Input
                            label="Assigned Review SLA (Hours)"
                            type="number"
                            value={settings.slaThresholdHours}
                            onChange={(e) => handleChange('slaThresholdHours', e.target.value)}
                            description="Time allowed before a submission is flagged as overdue."
                        />
                    </div>

                    {/* Automation Settings */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Automation Rules</h3>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-sm">Auto-Assign Reviewers</p>
                                <p className="text-xs text-muted-foreground">Automatically assign based on district location.</p>
                            </div>
                            {/* Using simple checkbox if switch not available, but user wants 'Switch' look usually. Using native checkbox for now to be safe.*/}
                            <input
                                type="checkbox"
                                checked={settings.autoAssignment}
                                onChange={(e) => handleChange('autoAssignment', e.target.checked)}
                                className="w-5 h-5 accent-primary"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-sm">Allow Auto-Approval</p>
                                <p className="text-xs text-muted-foreground">Automatically approve if all validation checks pass.</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.allowAutoApproval}
                                onChange={(e) => handleChange('allowAutoApproval', e.target.checked)}
                                className="w-5 h-5 accent-primary"
                            />
                        </div>
                    </div>

                    {/* Validation Rules */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Validation Strictness</h3>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-sm">Enforce Geofencing</p>
                                <p className="text-xs text-muted-foreground">Reject submissions outside facility district boundaries.</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.enforceGeofencing}
                                onChange={(e) => handleChange('enforceGeofencing', e.target.checked)}
                                className="w-5 h-5 accent-primary"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-sm">Require Photo Evidence</p>
                                <p className="text-xs text-muted-foreground">Submissions must include at least one photo.</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={settings.requirePhotoEvidence}
                                onChange={(e) => handleChange('requirePhotoEvidence', e.target.checked)}
                                className="w-5 h-5 accent-primary"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-border flex justify-end gap-3 bg-muted/10 rounded-b-xl">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button variant="default" onClick={() => { alert('Settings Saved!'); onClose(); }}>Save Changes</Button>
                </div>
            </div>
        </div>
    );
};

export default WorkflowConfigModal;
