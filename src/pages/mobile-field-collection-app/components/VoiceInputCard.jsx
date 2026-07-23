import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';

const VoiceInputCard = ({ onTranscript }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');

  const languages = [
    { value: 'en-US', label: 'English (US)' },
    { value: 'en-GB', label: 'English (UK)' },
    { value: 'hi-IN', label: 'Hindi' },
    { value: 'es-ES', label: 'Spanish' },
    { value: 'fr-FR', label: 'French' },
    { value: 'de-DE', label: 'German' }
  ];

  const handleStartRecording = () => {
    setIsRecording(true);
    setTimeout(() => {
      const mockTranscript = "This is a primary healthcare facility located in the central district. The facility provides outpatient services, emergency care, and basic diagnostic services. It operates from 9 AM to 5 PM on weekdays.";
      setTranscript(mockTranscript);
      setIsRecording(false);
      onTranscript(mockTranscript);
    }, 3000);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
  };

  const handleClearTranscript = () => {
    setTranscript('');
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Icon name="Mic" size={20} className="text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Voice Input</h2>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Select
          label="Language"
          options={languages}
          value={selectedLanguage}
          onChange={setSelectedLanguage}
        />

        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          {isRecording ? (
            <>
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-error/20 flex items-center justify-center animate-pulse">
                  <Icon name="Mic" size={40} className="text-error" />
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-error animate-ping"></div>
              </div>
              <p className="text-sm font-medium text-foreground">Recording...</p>
              <Button
                variant="destructive"
                iconName="Square"
                iconPosition="left"
                onClick={handleStopRecording}
              >
                Stop Recording
              </Button>
            </>
          ) : (
            <>
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon name="Mic" size={40} className="text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">Tap to start voice input</p>
              <Button
                variant="default"
                iconName="Mic"
                iconPosition="left"
                onClick={handleStartRecording}
              >
                Start Recording
              </Button>
            </>
          )}
        </div>

        {transcript && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Transcript</label>
              <Button
                variant="ghost"
                size="sm"
                iconName="Trash2"
                iconPosition="left"
                onClick={handleClearTranscript}
              >
                Clear
              </Button>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg border border-border">
              <p className="text-sm text-foreground">{transcript}</p>
            </div>
            <Button
              variant="outline"
              iconName="Copy"
              iconPosition="left"
              fullWidth
            >
              Copy to Clipboard
            </Button>
          </div>
        )}

        <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
          <Icon name="Info" size={16} className="text-muted-foreground mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Speak clearly and at a normal pace for best results. Voice input supports multiple languages.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoiceInputCard;