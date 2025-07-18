// Customer Information
export interface CustomerInfo {
  eventId: string;
  customerName: string;
  customerId: string;
  outletAddress: string;
  acrebisSupervisor: string;
  customerSupervisor: string;
  dateOfStockTake: string;
  timeOfStockTake: string;
  totalStocktakeLocation: number;
  logo: string;
}

// Saved Event
export interface SavedEvent {
  eventId: string;
  customerInfo: CustomerInfo;
  savedAt: string;
}

// Data Sources
export interface TagMaster {
  SKU: string;
  UPC: string;
  DESCRIPTION: string;
}

export interface ItemMaster {
  TAG_AREA_DESCRIPTION: string; // This is now TAG DESCRIPTION
  TAG: string; // This now contains the direct TAG values (e.g., 1, 2, 3, 1000, 1001, etc.)
  SHELF: string; // New field for SHELF values
}

export interface ScanData {
  DO_NOT_USE?: string;
  SHEET_NAME?: string;
  TAG: string; // TAG field from SCAN DATA
  SHELF: string; // New SHELF field from SCAN DATA
  UPC: string;
  SKU?: string;
  DESCRIPTION?: string;
  QTY: number; // Changed from QUANTITY to QTY to match Excel file
  QUANTITY?: number; // Keep for backward compatibility
  DATE: string;
}

// Combined data for reports
export interface AllProductReportItem {
  TAG: string;
  TAG_AREA_DESCRIPTION: string;
  TAG_SUB_AREA: string;
  UPC: string;
  SKU: string;
  DESCRIPTION: string;
  QUANTITY: number;
  VERIFIED_QUANTITY?: number;
  REMARKS?: string;
  DATE: string;
}

export interface SkuUpcReportItem {
  SKU: string;
  UPC: string;
  QUANTITY: number;
}

export interface SkuTagReportItem {
  SKU: string;
  TAG: string;
  QUANTITY: number;
}

export interface TagSummaryReportItem {
  TAG: string;
  TAG_AREA_DESCRIPTION: string;
  TAG_SUB_AREA: string;
  QUANTITY: number;
}

export interface DetailedScanReportItem {
  TAG: string;
  TAG_SUB_AREA: string;
  SKU: string;
  UPC: string;
  DESCRIPTION: string;
  QUANTITY: number;
}

// Updated interface for Interim SKU Area Report with new columns
export interface InterimSkuAreaReportItem {
  TAG: string;
  SHELF: string;
  UPC: string;
  DESCRIPTION: string;
  SKU: string;
  QUANTITY: number;
  AUDITED_QTY?: number; // New column
  REMARKS?: string; // New column
}

// Application State
export interface AppState {
  customerInfo: CustomerInfo;
  tagMaster: TagMaster[];
  itemMaster: ItemMaster[];
  scanData: ScanData[];
  isDataLoaded: boolean;
  activeReport: string;
  selectedTagSubArea: string | null;
  selectedTags: string[]; // New field for multi-select
}