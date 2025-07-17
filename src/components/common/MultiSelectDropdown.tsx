import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';

interface MultiSelectDropdownProps {
  options: string[];
  selectedOptions: string[];
  onSelectionChange: (selectedOptions: string[]) => void;
  label: string;
  placeholder?: string;
  disabled?: boolean;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  selectedOptions,
  onSelectionChange,
  label,
  placeholder = "Select options",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleOptionToggle = (option: string) => {
    const newSelection = selectedOptions.includes(option)
      ? selectedOptions.filter(o => o !== option)
      : [...selectedOptions, option];
    
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    const filteredOptions = getFilteredOptions();
    if (selectedOptions.length === filteredOptions.length) {
      onSelectionChange([]);
    } else {
      // Select all filtered options, keeping existing selections from other filters
      const newSelection = [...new Set([...selectedOptions, ...filteredOptions])];
      onSelectionChange(newSelection);
    }
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const getFilteredOptions = () => {
    if (!searchTerm) return options;
    return options.filter(option =>
      option.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getDisplayText = () => {
    if (disabled) {
      return placeholder;
    }
    
    if (selectedOptions.length === 0) {
      return `All ${label}s`;
    } else if (selectedOptions.length === 1) {
      return selectedOptions[0];
    } else if (selectedOptions.length === options.length) {
      return `All ${label}s`;
    } else {
      return `${selectedOptions.length} ${label}s selected`;
    }
  };

  const filteredOptions = getFilteredOptions();
  const filteredSelectedCount = filteredOptions.filter(option => 
    selectedOptions.includes(option)
  ).length;

  return (
    <div className="flex items-center">
      <label className="mr-2 font-medium">Filter by {label}:</label>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`flex items-center justify-between min-w-48 px-3 py-1.5 border border-gray-300 rounded bg-white transition-colors ${
            disabled 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
          }`}
        >
          <span className="truncate">{getDisplayText()}</span>
          <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
            {/* Search Input */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={`Search ${label}s...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Header with Select All / Clear All */}
            <div className="sticky top-[60px] bg-gray-50 border-b border-gray-200 px-3 py-2">
              <div className="flex justify-between items-center">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  {filteredSelectedCount === filteredOptions.length ? 'Deselect All' : 'Select All'}
                  {searchTerm && ` (${filteredOptions.length})`}
                </button>
                {selectedOptions.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-gray-500">
                  No {label}s found
                </div>
              ) : (
                <div className="py-1">
                  {filteredOptions.map((option) => (
                    <label
                      key={option}
                      className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedOptions.includes(option)}
                          onChange={() => handleOptionToggle(option)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                          selectedOptions.includes(option)
                            ? 'bg-primary-600 border-primary-600'
                            : 'border-gray-300'
                        }`}>
                          {selectedOptions.includes(option) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                      <span className="ml-3 text-sm">{option}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiSelectDropdown;