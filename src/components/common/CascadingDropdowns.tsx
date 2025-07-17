import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface CascadingDropdownsProps {
  tags: string[];
  shelves: string[];
  selectedTag: string | null;
  selectedShelf: string | null;
  onTagChange: (tag: string | null) => void;
  onShelfChange: (shelf: string | null) => void;
}

const CascadingDropdowns: React.FC<CascadingDropdownsProps> = ({
  tags,
  shelves,
  selectedTag,
  selectedShelf,
  onTagChange,
  onShelfChange,
}) => {
  const [isTagOpen, setIsTagOpen] = useState(false);
  const [isShelfOpen, setIsShelfOpen] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const shelfDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
        setIsTagOpen(false);
      }
      if (shelfDropdownRef.current && !shelfDropdownRef.current.contains(event.target as Node)) {
        setIsShelfOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTagSelect = (tag: string | null) => {
    onTagChange(tag);
    onShelfChange(null); // Reset shelf when tag changes
    setIsTagOpen(false);
  };

  const handleShelfSelect = (shelf: string | null) => {
    onShelfChange(shelf);
    setIsShelfOpen(false);
  };

  const getTagDisplayText = () => {
    return selectedTag || "Select TAG";
  };

  const getShelfDisplayText = () => {
    if (!selectedTag) return "Select TAG first";
    return selectedShelf || "Select SHELF";
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center">
        <label className="mr-2 font-medium">Filter by TAG:</label>
        <div className="relative" ref={tagDropdownRef}>
          <button
            onClick={() => setIsTagOpen(!isTagOpen)}
            className="flex items-center justify-between min-w-32 px-3 py-1.5 border border-gray-300 rounded bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <span className="truncate">{getTagDisplayText()}</span>
            <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isTagOpen ? 'rotate-180' : ''}`} />
          </button>

          {isTagOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto">
              <div className="py-1">
                <button
                  onClick={() => handleTagSelect(null)}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${
                    selectedTag === null ? 'bg-primary-50 text-primary-700' : ''
                  }`}
                >
                  All TAGs
                </button>
                {tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagSelect(tag)}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${
                      selectedTag === tag ? 'bg-primary-50 text-primary-700' : ''
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center">
        <label className="mr-2 font-medium">Filter by SHELF:</label>
        <div className="relative" ref={shelfDropdownRef}>
          <button
            onClick={() => selectedTag && setIsShelfOpen(!isShelfOpen)}
            disabled={!selectedTag}
            className={`flex items-center justify-between min-w-32 px-3 py-1.5 border border-gray-300 rounded bg-white transition-colors ${
              selectedTag 
                ? 'hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span className="truncate">{getShelfDisplayText()}</span>
            <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isShelfOpen ? 'rotate-180' : ''}`} />
          </button>

          {isShelfOpen && selectedTag && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto">
              <div className="py-1">
                <button
                  onClick={() => handleShelfSelect(null)}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${
                    selectedShelf === null ? 'bg-primary-50 text-primary-700' : ''
                  }`}
                >
                  All SHELVEs
                </button>
                {shelves.map((shelf) => (
                  <button
                    key={shelf}
                    onClick={() => handleShelfSelect(shelf)}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${
                      selectedShelf === shelf ? 'bg-primary-50 text-primary-700' : ''
                    }`}
                  >
                    {shelf}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CascadingDropdowns;