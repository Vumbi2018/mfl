import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';

const SearchBar = ({ onSearch, onAdvancedSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced Search State
  const [advFilters, setAdvFilters] = useState({
    name: '',
    radius: '',
    minBeds: '',
    maxBeds: ''
  });

  const handleSearch = (e) => {
    e?.preventDefault();
    onSearch(searchQuery);
  };

  const handleAdvChange = (key, value) => {
    setAdvFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyAdvancedSearch = () => {
    if (onAdvancedSearch) {
      onAdvancedSearch(advFilters);
    }
    setShowAdvanced(false);
  };

  const [isListening, setIsListening] = useState(false);

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice search is not supported in this browser.');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      onSearch(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="relative">
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Input
            type="search"
            placeholder={isListening ? "Listening..." : "Search facilities by name, type, location, or services..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e?.target?.value)}
            className="pr-20"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
              title="Advanced Search"
            >
              <Icon name="SlidersHorizontal" size={16} />
            </button>
            <button
              type="submit"
              onClick={handleSearch}
              className="p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              title="Search"
            >
              <Icon name="Search" size={16} />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleVoiceSearch}
          className={`px-4 py-2 rounded-md border transition-colors flex items-center gap-2 ${isListening ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'border-border hover:bg-muted'}`}
          title="Voice Search"
        >
          <Icon name={isListening ? "MicOff" : "Mic"} size={18} />
        </button>
      </form>
      {/* Advanced Search Panel */}
      {
        showAdvanced && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-card-lg p-4 z-20 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">Advanced Search</h3>
              <button
                onClick={() => setShowAdvanced(false)}
                className="p-1 rounded-md hover:bg-muted transition-colors"
              >
                <Icon name="X" size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <Input
                label="Facility Name"
                type="text"
                placeholder="Enter facility name"
                value={advFilters.name}
                onChange={(e) => handleAdvChange('name', e.target.value)}
              />
              <Input
                label="Location Radius (km)"
                type="number"
                placeholder="Search within radius"
                value={advFilters.radius}
                onChange={(e) => handleAdvChange('radius', e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Min Beds"
                  type="number"
                  placeholder="0"
                  value={advFilters.minBeds}
                  onChange={(e) => handleAdvChange('minBeds', e.target.value)}
                />
                <Input
                  label="Max Beds"
                  type="number"
                  placeholder="1000"
                  value={advFilters.maxBeds}
                  onChange={(e) => handleAdvChange('maxBeds', e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={applyAdvancedSearch}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Apply Filters
                </button>
                <button
                  onClick={() => setShowAdvanced(false)}
                  className="px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
};

export default SearchBar;