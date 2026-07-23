import React, { useState, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const VoiceInputRecorder = ({ isOpen, onClose, onSave }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [transcript, setTranscript] = useState('');
  const mediaRecorderRef = useRef(null);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator?.mediaDevices?.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Microphone access error:', error);
      alert('Unable to access microphone. Please grant microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef?.current && isRecording) {
      mediaRecorderRef?.current?.stop();
      setIsRecording(false);
      clearInterval(timerRef?.current);
      
      // Simulate voice-to-text conversion
      setTranscript('Temperature reading shows +12°C, which is outside the acceptable range. Compressor is making unusual noise. Checking electrical connections and thermostat settings.');
    }
  };

  const handleSave = () => {
    if (!audioBlob) return;
    
    onSave?.({
      audio: audioBlob,
      transcript: transcript,
      duration: recordingTime,
      timestamp: new Date().toISOString()
    });
    
    // Reset
    setAudioBlob(null);
    setTranscript('');
    setRecordingTime(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs?.toString()?.padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center">
      <div className="bg-card border border-border rounded-t-2xl md:rounded-lg shadow-lg w-full md:max-w-lg mx-0 md:mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon name="Mic" size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Voice Note</h2>
              <p className="text-xs text-muted-foreground">Record fault documentation</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            iconName="X"
            onClick={onClose}
          />
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Recording Interface */}
          <div className="text-center space-y-4">
            {isRecording ? (
              <>
                <div className="w-32 h-32 mx-auto rounded-full bg-error/10 border-4 border-error flex items-center justify-center animate-pulse">
                  <Icon name="Mic" size={48} className="text-error" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-error">{formatTime(recordingTime)}</p>
                  <p className="text-sm text-muted-foreground mt-1">Recording in progress...</p>
                </div>
                <Button
                  variant="default"
                  size="lg"
                  fullWidth
                  iconName="Square"
                  iconPosition="left"
                  onClick={stopRecording}
                  className="bg-error hover:bg-error/90"
                >
                  Stop Recording
                </Button>
              </>
            ) : audioBlob ? (
              <>
                <div className="w-32 h-32 mx-auto rounded-full bg-success/10 border-4 border-success flex items-center justify-center">
                  <Icon name="Check" size={48} className="text-success" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-success">Recording Complete</p>
                  <p className="text-sm text-muted-foreground mt-1">Duration: {formatTime(recordingTime)}</p>
                </div>
                
                {/* Voice-to-Text Transcript */}
                {transcript && (
                  <div className="bg-muted/30 p-4 rounded-lg text-left">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="FileText" size={16} className="text-primary" />
                      <p className="text-xs font-semibold text-muted-foreground">Auto-Generated Transcript</p>
                    </div>
                    <p className="text-sm text-foreground">{transcript}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="w-32 h-32 mx-auto rounded-full bg-primary/10 border-4 border-primary flex items-center justify-center">
                  <Icon name="Mic" size={48} className="text-primary" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">Ready to Record</p>
                  <p className="text-sm text-muted-foreground mt-1">Tap to start voice recording</p>
                </div>
                <Button
                  variant="default"
                  size="lg"
                  fullWidth
                  iconName="Mic"
                  iconPosition="left"
                  onClick={startRecording}
                >
                  Start Recording
                </Button>
              </>
            )}
          </div>

          {/* Multi-language Support Info */}
          <div className="bg-info/10 border border-info/20 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Icon name="Globe" size={16} className="text-info mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-info mb-1">Multi-Language Support</p>
                <p className="text-xs text-info/80">
                  Supports Tok Pisin, English, and Hiri Motu voice input
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        {audioBlob && (
          <div className="flex items-center gap-3 p-4 border-t border-border">
            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                setAudioBlob(null);
                setTranscript('');
                setRecordingTime(0);
              }}
            >
              Re-record
            </Button>
            <Button
              variant="default"
              fullWidth
              iconName="Save"
              iconPosition="left"
              onClick={handleSave}
            >
              Save Voice Note
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceInputRecorder;