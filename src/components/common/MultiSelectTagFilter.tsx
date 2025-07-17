import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

interface MultiSelectTagFilterProps {
  tags: string[];
  selectedTags: string[];
  onSelectionChange: (selectedTags: string[]) => void;
  label?: string;
}

const MultiSelectTagFilter: React.FC<MultiSelectTagFilterProps> = ({
  tags,
  selectedTags,
  onSelectionChange,
  label = "Filter by TAGs:"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTagToggle = (tag: string) => {
    const newSelection = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedTags.length === tags.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange([...tags]);
    }
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const getDisplayText = () => {
    if (selectedTags.length === 0) {
      return "All TAGs";
    } else if (selectedTags.length === 1) {
      return selectedTags[0];
    } else if (selectedTags.length === tags.length) {
      return "All TAGs";
    } else {
      return `${selectedTags.length} TAGs selected`;
    }
  };

  return (
    <div className="flex items-center">
      <label className="mr-2 font-medium">{label}</label>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between min-w-48 px-3 py-1.5 border border-gray-300 rounded bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <span className="truncate">{getDisplayText()}</span>
          <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto">
            {/* Header with Select All / Clear All */}
            <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-3 py-2">
              <div className="flex justify-between items-center">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  {selectedTags.length === tags.length ? 'Deselect All' : 'Select All'}
                </button>
                {selectedTags.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* TAG Options */}
            <div className="py-1">
              {tags.map((tag) => (
                <label
                  key={tag}
                  className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag)}
                      onChange={() => handleTagToggle(tag)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                      selectedTags.includes(tag)
                        ? 'bg-primary-600 border-primary-600'
                        : 'border-gray-300'
                    }`}>
                      {selectedTags.includes(tag) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>
                  <span className="ml-3 text-sm">{tag}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiSelectTagFilter;