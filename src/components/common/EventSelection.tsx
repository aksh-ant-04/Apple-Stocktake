import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, ChevronDown, Check } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const EventSelection: React.FC = () => {
  const { state, savedEvents, loadEvent } = useAppContext();
  const { customerInfo } = state;
  
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

  const handleEventSelect = (eventId: string) => {
    loadEvent(eventId);
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (customerInfo.eventId) {
      const event = savedEvents.find(e => e.eventId === customerInfo.eventId);
      return event ? `${event.eventId} - ${event.customerInfo.customerName}` : customerInfo.eventId;
    }
    return 'Select an Event ID';
  };

  const getSelectedEventInfo = () => {
    if (customerInfo.eventId) {
      const event = savedEvents.find(e => e.eventId === customerInfo.eventId);
      if (event) {
        return {
          eventId: event.eventId,
          customerName: event.customerInfo.customerName
        };
      }
    }
    return null;
  };

  const selectedEventInfo = getSelectedEventInfo();

  return (
    <motion.div 
      className="bg-white rounded-lg shadow-sm p-6 mb-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center mb-4">
        <Calendar className="w-5 h-5 text-primary-600 mr-2" />
        <h2 className="text-xl font-semibold">Event Selection</h2>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Event ID
        </label>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg bg-white hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          >
            <span className={`truncate ${!customerInfo.eventId ? 'text-gray-500' : 'text-gray-900'}`}>
              {getDisplayText()}
            </span>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {savedEvents.length === 0 ? (
                <div className="px-4 py-3 text-center text-gray-500">
                  No saved events available
                </div>
              ) : (
                <div className="py-1">
                  {savedEvents.map((event) => (
                    <button
                      key={event.eventId}
                      onClick={() => handleEventSelect(event.eventId)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between ${
                        customerInfo.eventId === event.eventId ? 'bg-primary-50 text-primary-700' : ''
                      }`}
                    >
                      <div>
                        <div className="font-medium">
                          {event.eventId} - {event.customerInfo.customerName}
                        </div>
                        <div className="text-sm text-gray-500">
                          Saved: {new Date(event.savedAt).toLocaleDateString()}
                        </div>
                      </div>
                      {customerInfo.eventId === event.eventId && (
                        <Check className="w-5 h-5 text-primary-600" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedEventInfo && (
        <motion.div 
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-sm">
            <span className="font-medium text-blue-800">Selected Event:</span>{' '}
            <span className="text-blue-700">{selectedEventInfo.eventId}</span>
          </div>
          <div className="text-sm text-blue-600 mt-1">
            Customer information and logo loaded from saved data
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default EventSelection;