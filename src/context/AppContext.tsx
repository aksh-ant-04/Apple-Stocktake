import React, { createContext, useState, useContext, ReactNode } from 'react';
import { 
  AppState, 
  CustomerInfo, 
  TagMaster, 
  ItemMaster, 
  ScanData,
  SavedEvent
} from '../types';

// Default customer info state
const defaultCustomerInfo: CustomerInfo = {
  eventId: '',
  customerName: '',
  customerId: '',
  outletAddress: '',
  acrebisSupervisor: '',
  customerSupervisor: '',
  dateOfStockTake: '',
  timeOfStockTake: '',
  totalStocktakeLocation: 0,
  logo: '',
};

// Local storage utilities
const STORAGE_KEY = 'stocktake_saved_events';

const loadSavedEvents = (): SavedEvent[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading saved events:', error);
    return [];
  }
};

const saveSavedEvents = (events: SavedEvent[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    console.error('Error saving events:', error);
  }
};

// Initial app state
const initialState: AppState = {
  customerInfo: defaultCustomerInfo,
  tagMaster: [],
  itemMaster: [],
  scanData: [],
  isDataLoaded: false,
  activeReport: '',
  selectedTagSubArea: null,
  selectedTags: [], // New field for multi-select
};

// Create context
const AppContext = createContext<{
  state: AppState;
  savedEvents: SavedEvent[];
  updateCustomerInfo: (info: Partial<CustomerInfo>) => void;
  setTagMaster: (data: TagMaster[]) => void;
  setItemMaster: (data: ItemMaster[]) => void;
  setScanData: (data: ScanData[]) => void;
  setActiveReport: (report: string) => void;
  setSelectedTagSubArea: (tagSubArea: string | null) => void;
  setSelectedTags: (tags: string[]) => void; // New function
  saveEvent: (eventId: string) => boolean;
  deleteEvent: (eventId: string) => void;
  loadEvent: (eventId: string) => void;
  clearCustomerInfo: () => void;
  resetData: () => void;
}>({
  state: initialState,
  savedEvents: [],
  updateCustomerInfo: () => {},
  setTagMaster: () => {},
  setItemMaster: () => {},
  setScanData: () => {},
  setActiveReport: () => {},
  setSelectedTagSubArea: () => {},
  setSelectedTags: () => {},
  saveEvent: () => false,
  deleteEvent: () => {},
  loadEvent: () => {},
  clearCustomerInfo: () => {},
  resetData: () => {},
});

// Provider component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(initialState);
  const [savedEvents, setSavedEvents] = useState<SavedEvent[]>(loadSavedEvents());

  const updateCustomerInfo = (info: Partial<CustomerInfo>) => {
    setState(prevState => ({
      ...prevState,
      customerInfo: {
        ...prevState.customerInfo,
        ...info,
      },
    }));
  };

  const saveEvent = (eventId: string): boolean => {
    if (!eventId.trim()) {
      return false;
    }

    const newEvent: SavedEvent = {
      eventId: eventId.trim(),
      customerInfo: { ...state.customerInfo, eventId: eventId.trim() },
      savedAt: new Date().toISOString(),
    };

    const updatedEvents = savedEvents.filter(event => event.eventId !== eventId.trim());
    updatedEvents.push(newEvent);
    
    setSavedEvents(updatedEvents);
    saveSavedEvents(updatedEvents);
    return true;
  };

  const deleteEvent = (eventId: string) => {
    const updatedEvents = savedEvents.filter(event => event.eventId !== eventId);
    setSavedEvents(updatedEvents);
    saveSavedEvents(updatedEvents);
    
    // If the deleted event is currently selected, clear the form
    if (state.customerInfo.eventId === eventId) {
      setState(prevState => ({
        ...prevState,
        customerInfo: defaultCustomerInfo,
      }));
    }
  };

  const loadEvent = (eventId: string) => {
    const event = savedEvents.find(e => e.eventId === eventId);
    if (event) {
      setState(prevState => ({
        ...prevState,
        customerInfo: event.customerInfo,
      }));
    }
  };

  const clearCustomerInfo = () => {
    setState(prevState => ({
      ...prevState,
      customerInfo: defaultCustomerInfo,
    }));
  };

  const setTagMaster = (data: TagMaster[]) => {
    setState(prevState => ({
      ...prevState,
      tagMaster: data,
      isDataLoaded: 
        data.length > 0 && 
        prevState.itemMaster.length > 0 && 
        prevState.scanData.length > 0,
    }));
  };

  const setItemMaster = (data: ItemMaster[]) => {
    setState(prevState => ({
      ...prevState,
      itemMaster: data,
      isDataLoaded: 
        prevState.tagMaster.length > 0 && 
        data.length > 0 && 
        prevState.scanData.length > 0,
    }));
  };

  const setScanData = (data: ScanData[]) => {
    setState(prevState => ({
      ...prevState,
      scanData: data,
      isDataLoaded: 
        prevState.tagMaster.length > 0 && 
        prevState.itemMaster.length > 0 && 
        data.length > 0,
    }));
  };

  const setActiveReport = (report: string) => {
    setState(prevState => ({
      ...prevState,
      activeReport: report,
    }));
  };

  const setSelectedTagSubArea = (tagSubArea: string | null) => {
    setState(prevState => ({
      ...prevState,
      selectedTagSubArea: tagSubArea,
    }));
  };

  const setSelectedTags = (tags: string[]) => {
    setState(prevState => ({
      ...prevState,
      selectedTags: tags,
    }));
  };

  const resetData = () => {
    setState(prevState => ({
      ...prevState,
      tagMaster: [],
      itemMaster: [],
      scanData: [],
      isDataLoaded: false,
      selectedTagSubArea: null,
      selectedTags: [],
    }));
  };

  return (
    <AppContext.Provider
      value={{
        state,
        savedEvents,
        updateCustomerInfo,
        setTagMaster,
        setItemMaster,
        setScanData,
        setActiveReport,
        setSelectedTagSubArea,
        setSelectedTags,
        saveEvent,
        deleteEvent,
        loadEvent,
        clearCustomerInfo,
        resetData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// Custom hook for using this context
export const useAppContext = () => useContext(AppContext);

export default AppContext;