import { 
  TagMaster, 
  ItemMaster, 
  ScanData, 
  AllProductReportItem,
  SkuUpcReportItem,
  SkuTagReportItem,
  TagSummaryReportItem,
  DetailedScanReportItem,
  InterimSkuAreaReportItem
} from '../types';

// Create indexes for faster lookups
const createIndex = <T extends Record<string, any>>(
  data: T[],
  key: keyof T
): Map<string, T> => {
  const index = new Map<string, T>();
  for (const item of data) {
    const indexKey = String(item[key]);
    index.set(indexKey, item);
  }
  return index;
};

// Helper function to extract TAG from scan data
const extractTagFromScanData = (scanItem: ScanData): string => {
  // Use TAG field directly from scan data, fallback to empty string if not available
  return scanItem.TAG || '';
};

// Helper function to extract SHELF from scan data
const extractShelfFromScanData = (scanItem: ScanData): string => {
  // Use SHELF field directly from scan data, fallback to empty string if not available
  return scanItem.SHELF || '';
};

// Helper function to extract QUANTITY from scan data with proper number conversion
const extractQuantityFromScanData = (scanItem: ScanData): number => {
  // Try QTY first (new field name), then QUANTITY (old field name)
  let qty = scanItem.QTY ?? scanItem.QUANTITY ?? 0;
  
  // Ensure it's a number
  if (typeof qty === 'string') {
    qty = parseFloat(qty) || 0;
  }
  
  return Number(qty) || 0;
};

// Helper function to create display TAG from TAG and SHELF
const createDisplayTag = (tag: string, shelf: string): string => {
  const tagNum = parseInt(tag);
  const shelfNum = parseInt(shelf);
  
  // Special buckets 1000-1006: display as TAG-SHELF format (e.g., 1000-01, 1000-02)
  if (tagNum >= 1000 && tagNum <= 1006) {
    return `${tag}-${shelf.padStart(2, '0')}`;
  }
  
  // SALES AREA tags (1, 2, 3, etc.): display as 6000 + TAG format (e.g., 6001, 6002, 6003)
  if (tagNum >= 1 && tagNum <= 999) {
    return `${6000 + tagNum}`;
  }
  
  // ISU and DEMO tags (7001+, 8001+): display as-is
  return tag;
};

// Helper function to reverse display TAG to original TAG for lookups
const reverseDisplayTag = (displayTag: string): string => {
  const displayNum = parseInt(displayTag);
  
  // Handle SALES AREA format (6001, 6002, etc.) -> convert back to (1, 2, etc.)
  if (displayNum >= 6001 && displayNum <= 6999) {
    return String(displayNum - 6000);
  }
  
  // Handle special buckets format (1000-01, 1000-02, etc.) -> extract TAG part
  if (displayTag.includes('-')) {
    return displayTag.split('-')[0];
  }
  
  // ISU and DEMO tags remain as-is
  return displayTag;
};

// Helper function to parse TAG and SHELF from complex TAG values (for TAG SUMMARY REPORT)
const parseTagAndShelf = (tag: string): { parsedTag: string; parsedShelf: string } => {
  const tagNum = parseInt(tag);
  
  // Handle 4-digit tags like 7818 -> TAG: 7000, SHELF: 818
  if (tagNum >= 7000 && tagNum <= 9999) {
    const tagPart = Math.floor(tagNum / 1000) * 1000; // Get 7000, 8000, etc.
    const shelfPart = tagNum % 1000; // Get 818, etc.
    return {
      parsedTag: String(tagPart),
      parsedShelf: String(shelfPart)
    };
  }
  
  // For other tags, use original tag and empty shelf
  return {
    parsedTag: tag,
    parsedShelf: ''
  };
};

// Generate Interim SKU Area Report data with SHELF TOTAL and TAG TOTAL lines
export const generateInterimSkuAreaReport = (
  scanData: ScanData[],
  itemMaster: TagMaster[] // This is the ITEM MASTER file (SKU, UPC, DESCRIPTION)
): InterimSkuAreaReportItem[] => {
  // Build index of ITEM MASTER by UPC for lookup
  const itemMasterByUpcIndex = new Map<string, TagMaster>();
  
  for (const item of itemMaster) {
    if (item.UPC) {
      itemMasterByUpcIndex.set(item.UPC, item);
    }
  }

  // Group scan data by TAG+SHELF+UPC combination and aggregate quantities
  const tagShelfUpcQuantityMap = new Map<string, InterimSkuAreaReportItem>();
  
  for (const scanItem of scanData) {
    // Get TAG and SHELF from scan data
    const tag = extractTagFromScanData(scanItem);
    const shelf = extractShelfFromScanData(scanItem);
    const quantity = extractQuantityFromScanData(scanItem);
    
    // Skip if quantity is 0 or invalid
    if (quantity <= 0) {
      continue;
    }
    
    // Get DESCRIPTION and SKU from ITEM MASTER using UPC
    const itemRecord = itemMasterByUpcIndex.get(scanItem.UPC);
    
    // Create unique key for aggregation: TAG + SHELF + UPC
    const aggregationKey = `${tag}_${shelf}_${scanItem.UPC}`;
    
    if (tagShelfUpcQuantityMap.has(aggregationKey)) {
      // Aggregate quantities
      const existing = tagShelfUpcQuantityMap.get(aggregationKey)!;
      existing.QUANTITY += quantity;
    } else {
      // Create new entry with new columns
      tagShelfUpcQuantityMap.set(aggregationKey, {
        TAG: tag,
        SHELF: shelf,
        UPC: scanItem.UPC,
        DESCRIPTION: itemRecord?.DESCRIPTION || '', // Get from ITEM MASTER
        SKU: itemRecord?.SKU || '', // Get from ITEM MASTER
        QUANTITY: quantity,
        AUDITED_QTY: undefined, // New empty column
        REMARKS: '', // New empty column
      });
    }
  }

  // Convert map to array and group by TAG and SHELF for totals
  const dataArray: InterimSkuAreaReportItem[] = Array.from(tagShelfUpcQuantityMap.values());
  
  // Sort by TAG first, then by SHELF, then by UPC
  dataArray.sort((a, b) => {
    // First sort by TAG
    const tagA = parseInt(a.TAG) || 0;
    const tagB = parseInt(b.TAG) || 0;
    if (tagA !== tagB) {
      return tagA - tagB;
    }
    
    // Then sort by SHELF
    const shelfA = parseInt(a.SHELF) || 0;
    const shelfB = parseInt(b.SHELF) || 0;
    if (shelfA !== shelfB) {
      return shelfA - shelfB;
    }
    
    // Finally sort by UPC
    return a.UPC.localeCompare(b.UPC);
  });

  // Group data by TAG and SHELF for adding totals
  const result: InterimSkuAreaReportItem[] = [];
  const tagGroups = new Map<string, Map<string, InterimSkuAreaReportItem[]>>();
  
  // Group data by TAG and SHELF
  for (const item of dataArray) {
    if (!tagGroups.has(item.TAG)) {
      tagGroups.set(item.TAG, new Map<string, InterimSkuAreaReportItem[]>());
    }
    
    const shelfGroups = tagGroups.get(item.TAG)!;
    if (!shelfGroups.has(item.SHELF)) {
      shelfGroups.set(item.SHELF, []);
    }
    
    shelfGroups.get(item.SHELF)!.push(item);
  }

  // Process each TAG group
  const sortedTags = Array.from(tagGroups.keys()).sort((a, b) => {
    const tagA = parseInt(a) || 0;
    const tagB = parseInt(b) || 0;
    return tagA - tagB;
  });

  for (const tag of sortedTags) {
    const shelfGroups = tagGroups.get(tag)!;
    const sortedShelves = Array.from(shelfGroups.keys()).sort((a, b) => {
      const shelfA = parseInt(a) || 0;
      const shelfB = parseInt(b) || 0;
      return shelfA - shelfB;
    });

    let tagTotal = 0;

    // Process each SHELF group within the TAG
    for (const shelf of sortedShelves) {
      const shelfItems = shelfGroups.get(shelf)!;
      
      // Add all items for this SHELF
      result.push(...shelfItems);
      
      // Calculate SHELF total
      const shelfTotal = shelfItems.reduce((sum, item) => sum + item.QUANTITY, 0);
      tagTotal += shelfTotal;
      
      // Add SHELF TOTAL line
      result.push({
        TAG: '',
        SHELF: '',
        UPC: '',
        DESCRIPTION: `SHELF ${shelf} TOTAL`,
        SKU: '',
        QUANTITY: shelfTotal,
        AUDITED_QTY: undefined,
        REMARKS: '',
      });
    }

    // Add TAG TOTAL line after all shelves for this TAG - Updated text
    result.push({
      TAG: '',
      SHELF: '',
      UPC: '',
      DESCRIPTION: `TAG ${tag} TOTAL (Of All Shelves)`,
      SKU: '',
      QUANTITY: tagTotal,
      AUDITED_QTY: undefined,
      REMARKS: '',
    });
  }

  return result;
};

// Get unique TAGs from scan data for dropdown
export const getUniqueTags = (scanData: ScanData[]): string[] => {
  const uniqueTags = new Set<string>();
  
  for (const scanItem of scanData) {
    const tag = extractTagFromScanData(scanItem);
    if (tag) {
      uniqueTags.add(tag);
    }
  }
  
  return Array.from(uniqueTags).sort((a, b) => {
    const aNum = parseInt(a) || 0;
    const bNum = parseInt(b) || 0;
    return aNum - bNum;
  });
};

// Get unique SHELVEs for selected TAGs from scan data
export const getUniqueShelvesByTags = (scanData: ScanData[], selectedTags: string[]): string[] => {
  const uniqueShelves = new Set<string>();
  
  for (const scanItem of scanData) {
    const tag = extractTagFromScanData(scanItem);
    const shelf = extractShelfFromScanData(scanItem);
    
    if (selectedTags.includes(tag) && shelf) {
      uniqueShelves.add(shelf);
    }
  }
  
  return Array.from(uniqueShelves).sort((a, b) => {
    const aNum = parseInt(a) || 0;
    const bNum = parseInt(b) || 0;
    return aNum - bNum;
  });
};

// Get unique SHELVEs for a specific TAG from scan data (legacy function for backward compatibility)
export const getUniqueShelvesByTag = (scanData: ScanData[], selectedTag: string): string[] => {
  return getUniqueShelvesByTags(scanData, [selectedTag]);
};

// Filter Interim SKU Area Report by multiple TAGs and SHELVEs
export const filterInterimSkuAreaReport = (
  data: InterimSkuAreaReportItem[],
  selectedTags: string[],
  selectedShelves: string[]
): InterimSkuAreaReportItem[] => {
  if (selectedTags.length === 0 && selectedShelves.length === 0) {
    return data;
  }
  
  return data.filter(item => {
    // Handle total lines with improved logic
    if (item.DESCRIPTION.includes('TOTAL')) {
      // For SHELF TOTAL lines, check if both TAG and SHELF match selections
      if (item.DESCRIPTION.includes('SHELF') && item.DESCRIPTION.includes('TOTAL') && !item.DESCRIPTION.includes('TAG')) {
        const shelfMatch = item.DESCRIPTION.match(/SHELF (\d+) TOTAL/);
        if (shelfMatch) {
          const shelfNumber = shelfMatch[1];
          // Only include if this shelf is in selected shelves (or no shelf filter)
          const shelfMatches = selectedShelves.length === 0 || selectedShelves.includes(shelfNumber);
          
          // Also check if this shelf total belongs to any of the selected tags
          // We need to look at the context - find the preceding data to determine which TAG this shelf belongs to
          const dataIndex = data.indexOf(item);
          let belongsToSelectedTag = false;
          
          // Look backwards to find the TAG this shelf belongs to
          for (let i = dataIndex - 1; i >= 0; i--) {
            const prevItem = data[i];
            if (prevItem.TAG && !prevItem.DESCRIPTION.includes('TOTAL')) {
              // Found a data row with TAG - check if it's in selected tags
              belongsToSelectedTag = selectedTags.length === 0 || selectedTags.includes(prevItem.TAG);
              break;
            }
          }
          
          return shelfMatches && belongsToSelectedTag;
        }
      }
      
      // For TAG TOTAL lines, check if the tag is in selected tags
      if (item.DESCRIPTION.includes('TAG') && item.DESCRIPTION.includes('TOTAL')) {
        const tagMatch = item.DESCRIPTION.match(/TAG (\d+) TOTAL/);
        if (tagMatch) {
          const tagNumber = tagMatch[1];
          return selectedTags.length === 0 || selectedTags.includes(tagNumber);
        }
      }
      
      // If no specific pattern matches, exclude the total line
      return false;
    }
    
    // For regular data rows, apply normal filtering
    const tagMatch = selectedTags.length === 0 || selectedTags.includes(item.TAG);
    const shelfMatch = selectedShelves.length === 0 || selectedShelves.includes(item.SHELF);
    return tagMatch && shelfMatch;
  });
};

// Generate All Product Report data - Updated to use original TAG and SHELF from SCAN DATA (NO SUBTOTAL LINES)
export const generateAllProductReport = (
  scanData: ScanData[],
  itemMaster: ItemMaster[], // This is now TAG MASTER (TAG, TAG DESCRIPTION, SHELF)
  tagMaster: TagMaster[]    // This is now ITEM MASTER (SKU, UPC, DESCRIPTION)
): (AllProductReportItem & { SHELF: string })[] => {
  // Build indexes
  const itemMasterByUpcIndex = new Map<string, TagMaster>(); // ITEM MASTER indexed by UPC
  const tagMasterByTagIndex = new Map<string, ItemMaster>(); // TAG MASTER indexed by TAG

  // Build ITEM MASTER (SKU, UPC, DESCRIPTION) index by UPC
  for (const item of tagMaster) {
    if (item.UPC) {
      itemMasterByUpcIndex.set(item.UPC, item);
    }
  }
  
  // Build TAG MASTER (TAG, TAG DESCRIPTION, SHELF) index by TAG
  for (const tag of itemMaster) {
    tagMasterByTagIndex.set(tag.TAG, tag);
  }

  // Group data by original TAG+SHELF and aggregate by UPC within each group
  const groupedData = new Map<string, Map<string, AllProductReportItem & { SHELF: string }>>();
  let grandTotal = 0;

  // Process scan data and group by original TAG+SHELF, then aggregate by UPC
  for (const scanItem of scanData) {
    // Use original TAG and SHELF directly from SCAN DATA (no conversion)
    const originalTag = extractTagFromScanData(scanItem);
    const originalShelf = extractShelfFromScanData(scanItem);
    const quantity = extractQuantityFromScanData(scanItem);
    
    // Get TAG record for description (lookup by original TAG)
    const tagRecord = tagMasterByTagIndex.get(originalTag);
    
    // Check if UPC from SCAN DATA exists in ITEM MASTER (SKU, UPC, DESCRIPTION)
    const itemRecord = itemMasterByUpcIndex.get(scanItem.UPC);

    // Create unique key for grouping: originalTag + originalShelf
    const groupKey = `${originalTag}_${originalShelf}`;

    // Get or create the group for this TAG+SHELF
    if (!groupedData.has(groupKey)) {
      groupedData.set(groupKey, new Map<string, AllProductReportItem & { SHELF: string }>());
    }
    const tagShelfGroup = groupedData.get(groupKey)!;

    // Check if we already have an item with this UPC in this TAG+SHELF
    if (tagShelfGroup.has(scanItem.UPC)) {
      // Aggregate quantities
      const existingItem = tagShelfGroup.get(scanItem.UPC)!;
      existingItem.QUANTITY += quantity;
    } else {
      // Create new item - handle both cases: UPC found in ITEM MASTER and UPC missing from ITEM MASTER
      const item: AllProductReportItem & { SHELF: string } = {
        TAG: originalTag, // Use original TAG from SCAN DATA
        SHELF: originalShelf, // Use original SHELF from SCAN DATA
        TAG_AREA_DESCRIPTION: tagRecord?.TAG_AREA_DESCRIPTION || '', // TAG DESCRIPTION from TAG MASTER
        TAG_SUB_AREA: `${originalTag}-${originalShelf}`, // Combined for compatibility
        UPC: scanItem.UPC,
        SKU: itemRecord?.SKU || '', // SKU from ITEM MASTER if found, empty if missing
        DESCRIPTION: itemRecord?.DESCRIPTION || '', // DESCRIPTION from ITEM MASTER if found, empty if missing
        QUANTITY: quantity, // QUANTITY from SCAN DATA
        VERIFIED_QUANTITY: undefined, // Leave empty
        REMARKS: '', // Leave empty
        DATE: scanItem.DATE,
      };
      
      tagShelfGroup.set(scanItem.UPC, item);
    }

    // Update grand total
    grandTotal += quantity;
  }

  // Sort and combine results
  const result: (AllProductReportItem & { SHELF: string })[] = [];

  // Get all TAG+SHELF groups and sort them
  const sortedGroups = Array.from(groupedData.keys()).sort((a, b) => {
    const [tagA, shelfA] = a.split('_');
    const [tagB, shelfB] = b.split('_');
    
    const tagNumA = parseInt(tagA) || 0;
    const tagNumB = parseInt(tagB) || 0;
    
    if (tagNumA !== tagNumB) {
      return tagNumA - tagNumB;
    }
    
    const shelfNumA = parseInt(shelfA) || 0;
    const shelfNumB = parseInt(shelfB) || 0;
    return shelfNumA - shelfNumB;
  });

  // Process each TAG+SHELF group in order (NO SUBTOTAL LINES)
  for (const groupKey of sortedGroups) {
    const tagShelfGroup = groupedData.get(groupKey);
    if (tagShelfGroup) {
      // Convert map values to array and add to result
      const items = Array.from(tagShelfGroup.values());
      result.push(...items);
      
      // NO SUBTOTAL LINES - removed the subtotal addition
    }
  }

  // Add grand total row at the end
  result.push({
    TAG: '',
    SHELF: '',
    TAG_AREA_DESCRIPTION: '',
    TAG_SUB_AREA: 'GRAND TOTAL',
    UPC: '',
    SKU: '',
    DESCRIPTION: '',
    QUANTITY: grandTotal,
    VERIFIED_QUANTITY: undefined,
    REMARKS: '',
    DATE: '',
  });

  return result;
};

// Generate SKUUPC00R669 Report data - Extract UPC and QUANTITY from SCAN DATA, lookup SKU from TAG MASTER
export const generateSkuUpcReport = (
  tagMaster: TagMaster[],
  scanData: ScanData[]
): SkuUpcReportItem[] => {
  // Create index of TAG MASTER by UPC for lookup
  const tagMasterByUpcIndex = new Map<string, TagMaster>();
  
  for (const tag of tagMaster) {
    if (tag.UPC) {
      tagMasterByUpcIndex.set(tag.UPC, tag);
    }
  }

  // Group scan data by UPC and aggregate quantities
  const upcQuantityMap = new Map<string, number>();
  let grandTotal = 0;
  
  for (const scanItem of scanData) {
    const quantity = extractQuantityFromScanData(scanItem);
    const currentQuantity = upcQuantityMap.get(scanItem.UPC) || 0;
    upcQuantityMap.set(scanItem.UPC, currentQuantity + quantity);
    grandTotal += quantity;
  }

  // Generate report data
  const result: SkuUpcReportItem[] = [];
  
  for (const [upc, quantity] of upcQuantityMap.entries()) {
    // Lookup SKU from TAG MASTER using UPC
    const tagRecord = tagMasterByUpcIndex.get(upc);
    
    result.push({
      SKU: tagRecord?.SKU || '', // Use SKU from TAG MASTER if found, otherwise empty
      UPC: upc,
      QUANTITY: quantity,
    });
  }

  // Sort by UPC for consistent ordering
  result.sort((a, b) => a.UPC.localeCompare(b.UPC));

  // Add grand total row at the end
  result.push({
    SKU: '',
    UPC: 'GRAND TOTAL',
    QUANTITY: grandTotal,
  });

  return result;
};

// Generate SKUTAG00R669 Report data - Use original TAG from SCAN DATA (no display format)
export const generateSkuTagReport = (
  tagMaster: TagMaster[],
  itemMaster: ItemMaster[],
  scanData: ScanData[]
): SkuTagReportItem[] => {
  // Create index of TAG MASTER by UPC for SKU lookup
  const tagMasterByUpcIndex = new Map<string, TagMaster>();
  
  for (const tag of tagMaster) {
    if (tag.UPC) {
      tagMasterByUpcIndex.set(tag.UPC, tag);
    }
  }

  // Group scan data by SKU+original TAG combination and aggregate quantities
  const skuTagQuantityMap = new Map<string, { SKU: string; TAG: string; QUANTITY: number }>();
  let grandTotal = 0;
  
  for (const scanItem of scanData) {
    // Get original TAG from scan data (no display format conversion)
    const originalTag = extractTagFromScanData(scanItem);
    const quantity = extractQuantityFromScanData(scanItem);
    
    // Get SKU from TAG MASTER using UPC from SCAN DATA
    let sku = '';
    const tagRecord = tagMasterByUpcIndex.get(scanItem.UPC);
    if (tagRecord) {
      sku = tagRecord.SKU;
    } else {
      // Fallback: use SKU from SCAN DATA if TAG MASTER lookup fails
      sku = scanItem.SKU || '';
    }
    
    // Create unique key for aggregation: SKU + original TAG
    const aggregationKey = `${sku}_${originalTag}`;
    
    if (skuTagQuantityMap.has(aggregationKey)) {
      // Aggregate quantities
      const existing = skuTagQuantityMap.get(aggregationKey)!;
      existing.QUANTITY += quantity;
    } else {
      // Create new entry with original TAG
      skuTagQuantityMap.set(aggregationKey, {
        SKU: sku,
        TAG: originalTag, // Use original TAG, not display format
        QUANTITY: quantity,
      });
    }
    
    grandTotal += quantity;
  }

  // Convert map to array and sort
  const result: SkuTagReportItem[] = Array.from(skuTagQuantityMap.values());
  
  // Sort by TAG first, then by SKU - with defensive checks for undefined values
  result.sort((a, b) => {
    const tagA = a.TAG || '';
    const tagB = b.TAG || '';
    const skuA = a.SKU || '';
    const skuB = b.SKU || '';
    
    if (tagA !== tagB) {
      // Sort by numeric TAG value
      const aNum = parseInt(tagA) || 0;
      const bNum = parseInt(tagB) || 0;
      return aNum - bNum;
    }
    return skuA.localeCompare(skuB);
  });

  // Add grand total row at the end
  result.push({
    SKU: '',
    TAG: 'GRAND TOTAL',
    QUANTITY: grandTotal,
  });

  return result;
};

// Generate NOF Report data - Use original TAG from SCAN DATA (no display format)
export const generateNofReport = (
  scanData: ScanData[],
  itemMaster: TagMaster[]  // This is the ITEM MASTER file (SKU, UPC, DESCRIPTION)
): { UPC: string; TAG: string; QUANTITY: number }[] => {
  console.log('NOF Report Debug:');
  console.log('SCAN DATA sample:', scanData.slice(0, 3));
  console.log('ITEM MASTER sample:', itemMaster.slice(0, 3));
  
  // Create index of ITEM MASTER by UPC for verification
  const itemMasterUpcIndex = new Set<string>();
  
  for (const item of itemMaster) {
    if (item.UPC !== undefined && item.UPC !== null && item.UPC !== '') {
      const normalizedUpc = String(item.UPC).trim();
      if (normalizedUpc) {
        itemMasterUpcIndex.add(normalizedUpc);
      }
    }
  }
  
  console.log('ITEM MASTER UPCs (first 10):', Array.from(itemMasterUpcIndex).slice(0, 10));

  // Group scan data by UPC+original TAG combination and aggregate quantities
  // ONLY include UPCs that are NOT present in ITEM MASTER
  const upcTagQuantityMap = new Map<string, { UPC: string; TAG: string; QUANTITY: number }>();
  let grandTotal = 0;
  let processedCount = 0;
  let skippedCount = 0;
  
  for (const scanItem of scanData) {
    // Extract UPC from SCAN DATA - handle both string and number types
    let scanUpc = '';
    if (scanItem.UPC !== undefined && scanItem.UPC !== null) {
      scanUpc = String(scanItem.UPC).trim();
    }
    
    // Skip if UPC is empty or invalid
    if (!scanUpc) {
      continue;
    }
    
    // CRITICAL CHECK: Is this UPC present in ITEM MASTER?
    const isInItemMaster = itemMasterUpcIndex.has(scanUpc);
    
    if (isInItemMaster) {
      skippedCount++;
      continue; // Skip this record as UPC is present in ITEM MASTER
    }
    
    // Get original TAG from scan data (no display format conversion)
    const originalTag = extractTagFromScanData(scanItem);
    const quantity = extractQuantityFromScanData(scanItem);
    
    // Create unique key for aggregation: UPC + original TAG
    const aggregationKey = `${scanUpc}_${originalTag}`;
    
    if (upcTagQuantityMap.has(aggregationKey)) {
      // Aggregate quantities
      const existing = upcTagQuantityMap.get(aggregationKey)!;
      existing.QUANTITY += quantity;
    } else {
      // Create new entry with original TAG
      upcTagQuantityMap.set(aggregationKey, {
        UPC: scanUpc,
        TAG: originalTag, // Use original TAG, not display format
        QUANTITY: quantity,
      });
    }
    
    grandTotal += quantity;
    processedCount++;
  }
  
  console.log(`NOF Report Processing Summary:`);
  console.log(`- Total SCAN DATA records: ${scanData.length}`);
  console.log(`- Records skipped (UPC found in ITEM MASTER): ${skippedCount}`);
  console.log(`- Records processed (UPC NOT in ITEM MASTER): ${processedCount}`);
  console.log(`- Unique UPC+TAG combinations: ${upcTagQuantityMap.size}`);

  // Convert map to array and sort
  const result: { UPC: string; TAG: string; QUANTITY: number }[] = Array.from(upcTagQuantityMap.values());
  
  // Sort by TAG first, then by UPC
  result.sort((a, b) => {
    if (a.TAG !== b.TAG) {
      // Sort by numeric TAG value
      const aNum = parseInt(a.TAG) || 0;
      const bNum = parseInt(b.TAG) || 0;
      return aNum - bNum;
    }
    return a.UPC.localeCompare(b.UPC);
  });

  // Only add grand total row if there are actual records
  if (result.length > 0) {
    result.push({
      UPC: '',
      TAG: 'GRAND TOTAL',
      QUANTITY: grandTotal,
    });
  }

  console.log('NOF Report final result count:', result.length);
  return result;
};

// Generate Tag Summary Report data - Updated to show TAG, SHELF, TAG DESCRIPTION, QTY and summarize by SHELF
export const generateTagSummaryReport = (
  itemMaster: ItemMaster[],
  scanData: ScanData[],
  tagMaster: TagMaster[]
): (TagSummaryReportItem & { SHELF: string })[] => {
  // Create indexes
  const itemMasterIndex = new Map<string, ItemMaster>();
  const tagMasterByUpcIndex = new Map<string, TagMaster>();
  const tagMasterBySkuIndex = new Map<string, TagMaster>();

  // Build ITEM MASTER index by TAG
  for (const item of itemMaster) {
    itemMasterIndex.set(item.TAG, item);
  }
  
  // Build TAG MASTER indexes
  for (const tag of tagMaster) {
    if (tag.UPC) {
      tagMasterByUpcIndex.set(tag.UPC, tag);
    }
    tagMasterBySkuIndex.set(tag.SKU, tag);
  }

  // Group scan data by TAG+SHELF combination and aggregate quantities
  const tagShelfQuantityMap = new Map<string, { 
    TAG: string;
    SHELF: string;
    TAG_AREA_DESCRIPTION: string;
    TAG_SUB_AREA: string; 
    QUANTITY: number 
  }>();
  let grandTotal = 0;
  
  for (const scanItem of scanData) {
    // Get original TAG and SHELF from scan data
    const originalTag = extractTagFromScanData(scanItem);
    const shelf = extractShelfFromScanData(scanItem);
    const quantity = extractQuantityFromScanData(scanItem);
    
    // Display TAG as "7271 TAG" format
    const displayTag = `${originalTag} `;
    
    // Display SHELF as "Shelf 1" format (simplified shelf number)
    const displayShelf = `Shelf ${1}`;
    
    // Get TAG record for description (lookup by original TAG)
    const itemRecord = itemMasterIndex.get(originalTag);
    
    // Create unique key for aggregation: TAG + SHELF
    const aggregationKey = `${originalTag}_${shelf}`;
    
    if (tagShelfQuantityMap.has(aggregationKey)) {
      // Aggregate quantities
      const existing = tagShelfQuantityMap.get(aggregationKey)!;
      existing.QUANTITY += quantity;
    } else {
      // Create new entry
      tagShelfQuantityMap.set(aggregationKey, {
        TAG: displayTag,
        SHELF: displayShelf,
        TAG_AREA_DESCRIPTION: itemRecord?.TAG_AREA_DESCRIPTION || '',
        TAG_SUB_AREA: `${originalTag}-${shelf}`, // For compatibility
        QUANTITY: quantity,
      });
    }
    
    grandTotal += quantity;
  }

  // Convert map to array
  const result: (TagSummaryReportItem & { SHELF: string })[] = Array.from(tagShelfQuantityMap.values());
  
  // Sort by original TAG first, then by SHELF
  result.sort((a, b) => {
    // Extract original tag number from display format (e.g., "7271 TAG" -> 7271)
    const tagA = parseInt(a.TAG.split(' ')[0]) || 0;
    const tagB = parseInt(b.TAG.split(' ')[0]) || 0;
    
    if (tagA !== tagB) {
      return tagA - tagB;
    }
    
    // Extract shelf number from display format (e.g., "Shelf 271" -> 271)
    const shelfA = parseInt(a.SHELF.split(' ')[1]) || 0;
    const shelfB = parseInt(b.SHELF.split(' ')[1]) || 0;
    return shelfA - shelfB;
  });

  // Add grand total row at the end
  result.push({
    TAG: '',
    SHELF: '',
    TAG_AREA_DESCRIPTION: '',
    TAG_SUB_AREA: 'GRAND TOTAL',
    QUANTITY: grandTotal,
  });

  return result;
};

// Generate Detailed Scan Report data - Updated to use original TAG and SHELF from SCAN DATA (NO SUBTOTAL LINES)
export const generateDetailedScanReport = (
  itemMaster: ItemMaster[],
  scanData: ScanData[],
  tagMaster: TagMaster[]
): (DetailedScanReportItem & { SHELF: string })[] => {
  // Build indexes - ITEM MASTER now uses TAG field directly
  const itemMasterIndex = new Map<string, ItemMaster>();
  const tagMasterByUpcIndex = new Map<string, TagMaster>();
  const tagMasterBySkuIndex = new Map<string, TagMaster>();
  
  // Build ITEM MASTER index by TAG
  for (const item of itemMaster) {
    itemMasterIndex.set(item.TAG, item);
  }
  
  // Build TAG MASTER indexes
  for (const tag of tagMaster) {
    if (tag.UPC) {
      tagMasterByUpcIndex.set(tag.UPC, tag);
    }
    tagMasterBySkuIndex.set(tag.SKU, tag);
  }

  // Group data by original TAG+SHELF and aggregate by UPC within each group
  const groupedData = new Map<string, Map<string, DetailedScanReportItem & { SHELF: string }>>();
  let grandTotal = 0;

  // Process scan data and group by original TAG+SHELF, then aggregate by UPC
  for (const scanItem of scanData) {
    // Use original TAG and SHELF directly from SCAN DATA (no conversion)
    const originalTag = extractTagFromScanData(scanItem);
    const originalShelf = extractShelfFromScanData(scanItem);
    const quantity = extractQuantityFromScanData(scanItem);
    
    // Get ITEM MASTER record (lookup by original TAG)
    const itemRecord = itemMasterIndex.get(originalTag);
    
    // First try to find by UPC from SCAN DATA in TAG MASTER
    let tagRecord = tagMasterByUpcIndex.get(scanItem.UPC);
    
    // If not found by UPC, fallback to SKU lookup
    if (!tagRecord && scanItem.SKU) {
      tagRecord = tagMasterBySkuIndex.get(scanItem.SKU);
    }

    // Create unique key for grouping: originalTag + originalShelf
    const groupKey = `${originalTag}_${originalShelf}`;

    // Get or create the group for this TAG+SHELF
    if (!groupedData.has(groupKey)) {
      groupedData.set(groupKey, new Map<string, DetailedScanReportItem & { SHELF: string }>());
    }
    const tagShelfGroup = groupedData.get(groupKey)!;

    // Check if we already have an item with this UPC in this TAG+SHELF
    if (tagShelfGroup.has(scanItem.UPC)) {
      // Aggregate quantities
      const existingItem = tagShelfGroup.get(scanItem.UPC)!;
      existingItem.QUANTITY += quantity;
    } else {
      // Create new item - handle both cases: UPC found in TAG MASTER and UPC missing from TAG MASTER
      const item: DetailedScanReportItem & { SHELF: string } = {
        TAG: originalTag, // Use original TAG from SCAN DATA
        SHELF: originalShelf, // Use original SHELF from SCAN DATA
        TAG_SUB_AREA: `${originalTag}-${originalShelf}`, // Combined for compatibility
        SKU: tagRecord?.SKU || '', // SKU from TAG MASTER if found, empty if missing
        UPC: scanItem.UPC,
        DESCRIPTION: tagRecord?.DESCRIPTION || '', // DESCRIPTION from TAG MASTER if found, empty if missing
        QUANTITY: quantity,
      };
      
      tagShelfGroup.set(scanItem.UPC, item);
    }

    // Update grand total
    grandTotal += quantity;
  }

  // Sort and combine results
  const result: (DetailedScanReportItem & { SHELF: string })[] = [];

  // Get all TAG+SHELF groups and sort them
  const sortedGroups = Array.from(groupedData.keys()).sort((a, b) => {
    const [tagA, shelfA] = a.split('_');
    const [tagB, shelfB] = b.split('_');
    
    const tagNumA = parseInt(tagA) || 0;
    const tagNumB = parseInt(tagB) || 0;
    
    if (tagNumA !== tagNumB) {
      return tagNumA - tagNumB;
    }
    
    const shelfNumA = parseInt(shelfA) || 0;
    const shelfNumB = parseInt(shelfB) || 0;
    return shelfNumA - shelfNumB;
  });

  // Process each TAG+SHELF group in order (NO SUBTOTAL LINES)
  for (const groupKey of sortedGroups) {
    const tagShelfGroup = groupedData.get(groupKey);
    if (tagShelfGroup) {
      // Convert map values to array and add to result
      const items = Array.from(tagShelfGroup.values());
      result.push(...items);
      
      // NO SUBTOTAL LINES - removed the subtotal addition
    }
  }

  // Add grand total row at the end
  result.push({
    TAG: '',
    SHELF: '',
    TAG_SUB_AREA: 'GRAND TOTAL',
    SKU: '',
    UPC: '',
    DESCRIPTION: '',
    QUANTITY: grandTotal,
  });

  return result;
};

// Calculate subtotals with optimized aggregation
export const calculateSubtotals = <T extends Record<string, any>>(
  data: T[],
  groupByField: keyof T,
  valueField: keyof T
): Record<string, number> => {
  const subtotals: Record<string, number> = {};
  const chunkSize = 1000;
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    
    for (const item of chunk) {
      const groupKey = String(item[groupByField]);
      const value = Number(item[valueField]) || 0;
      
      subtotals[groupKey] = (subtotals[groupKey] || 0) + value;
    }
  }
  
  return subtotals;
};

// Get unique values with Set for optimal performance
export const getUniqueValues = <T extends Record<string, any>>(
  data: T[],
  field: keyof T
): string[] => {
  const uniqueValues = new Set<string>();
  const chunkSize = 1000;
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    
    for (const item of chunk) {
      if (item[field]) {
        uniqueValues.add(String(item[field]));
      }
    }
  }
  
  return Array.from(uniqueValues).sort();
};

// Filter data by TAG instead of TAG_SUB_AREA
export const filterByTag = <T extends { TAG?: string }>(
  data: T[],
  tag: string | null
): T[] => {
  if (!tag) return data;
  
  const result: T[] = [];
  const chunkSize = 1000;
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    for (const item of chunk) {
      if (item.TAG === tag || 
          (item.TAG && item.TAG.startsWith('Sub total') && 
           item.TAG.includes(`"${tag}"`))) {
        result.push(item);
      }
    }
  }
  
  return result;
};

// Legacy function for backward compatibility - now filters by TAG
export const filterByTagSubArea = <T extends { TAG_SUB_AREA?: string; TAG?: string }>(
  data: T[],
  tagSubArea: string | null
): T[] => {
  if (!tagSubArea) return data;
  
  const result: T[] = [];
  const chunkSize = 1000;
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    for (const item of chunk) {
      // Check both TAG_SUB_AREA and TAG for compatibility
      if (item.TAG_SUB_AREA === tagSubArea || 
          item.TAG === tagSubArea ||
          (item.TAG_SUB_AREA && item.TAG_SUB_AREA.startsWith('Sub total') && 
           item.TAG_SUB_AREA.includes(`"${tagSubArea}"`))) {
        result.push(item);
      }
    }
  }
  
  return result;
};

// New function for multi-select TAG filtering with conditional subtotal/grand total logic
export const filterByMultipleTags = <T extends { TAG_SUB_AREA?: string; TAG?: string; SHELF?: string; QUANTITY?: number }>(
  data: T[],
  selectedTags: string[]
): T[] => {
  if (selectedTags.length === 0) return data;
  
  const result: T[] = [];
  const chunkSize = 1000;
  let selectedTagsTotal = 0;
  
  // First pass: collect data and calculate selected tags total
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    for (const item of chunk) {
      // Check if item belongs to any of the selected TAGs
      const itemTag = item.TAG;
      
      if (itemTag) {
        // Check for exact match
        if (selectedTags.includes(itemTag)) {
          result.push(item);
          // Add to selected tags total (exclude subtotal and grand total rows)
          if (item.QUANTITY && !item.TAG_SUB_AREA?.startsWith('Sub total') && item.TAG_SUB_AREA !== 'GRAND TOTAL') {
            selectedTagsTotal += item.QUANTITY;
          }
          continue;
        }
        
        // Check for subtotal rows that belong to selected TAGs
        if (item.TAG_SUB_AREA?.startsWith('Sub total of SHELF')) {
          const isSubtotalForSelectedTag = selectedTags.some(tag => 
            item.TAG_SUB_AREA?.includes(`TAG ${tag}`)
          );
          if (isSubtotalForSelectedTag) {
            result.push(item);
            continue;
          }
        }
      }
    }
  }
  
  // Add conditional grand total logic:
  // - If only one TAG is selected, exclude grand total
  // - If multiple TAGs are selected, include grand total with recalculated value
  if (selectedTags.length > 1) {
    // Find and update the grand total row with the sum of selected TAGs only
    const grandTotalItem = data.find(item => 
      (item.TAG_SUB_AREA === 'GRAND TOTAL')
    );
    
    if (grandTotalItem) {
      // Create a new grand total item with the selected tags total
      const updatedGrandTotal = { 
        ...grandTotalItem, 
        QUANTITY: selectedTagsTotal 
      } as T;
      result.push(updatedGrandTotal);
    }
  }
  
  return result;
};

// New function for multi-select TAG and SHELF filtering for All Product and Detailed Scan reports (NO SUBTOTAL LINES)
export const filterByMultipleTagsAndShelves = <T extends { TAG?: string; SHELF?: string; TAG_SUB_AREA?: string; QUANTITY?: number }>(
  data: T[],
  selectedTags: string[],
  selectedShelves: string[]
): T[] => {
  if (selectedTags.length === 0 && selectedShelves.length === 0) return data;
  
  const result: T[] = [];
  const chunkSize = 1000;
  let selectedTotal = 0;
  
  // First pass: collect data and calculate selected total
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    for (const item of chunk) {
      // Check if item belongs to any of the selected TAGs and SHELVEs
      const itemTag = item.TAG;
      const itemShelf = item.SHELF;
      
      // Check for grand total rows (NO SUBTOTAL LINES)
      if (item.TAG_SUB_AREA === 'GRAND TOTAL') {
        // Handle grand total separately at the end
        continue;
      }
      
      // For regular data rows, apply TAG and SHELF filtering
      const tagMatch = selectedTags.length === 0 || (itemTag && selectedTags.includes(itemTag));
      const shelfMatch = selectedShelves.length === 0 || (itemShelf && selectedShelves.includes(itemShelf));
      
      if (tagMatch && shelfMatch) {
        result.push(item);
        // Add to selected total (exclude subtotal and grand total rows)
        if (item.QUANTITY) {
          selectedTotal += item.QUANTITY;
        }
      }
    }
  }
  
  // Add grand total if filters are applied
  if ((selectedTags.length > 0 || selectedShelves.length > 0) && selectedTotal > 0) {
    const grandTotalItem = data.find(item => item.TAG_SUB_AREA === 'GRAND TOTAL');
    
    if (grandTotalItem) {
      // Create a new grand total item with the selected total
      const updatedGrandTotal = { 
        ...grandTotalItem, 
        QUANTITY: selectedTotal 
      } as T;
      result.push(updatedGrandTotal);
    }
  }
  
  return result;
};