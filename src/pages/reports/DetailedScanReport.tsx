import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';
import { 
  generateDetailedScanReport,
  filterByMultipleTagsAndShelves,
  getUniqueTags,
  getUniqueShelvesByTags
} from '../../utils/dataProcessing';
import CustomerInfoForm from '../../components/common/CustomerInfoForm';
import ReportHeader from '../../components/common/ReportHeader';
import DownloadButtons from '../../components/common/DownloadButtons';
import ReportTable from '../../components/common/ReportTable';
import MultiSelectDropdown from '../../components/common/MultiSelectDropdown';

const DetailedScanReport: React.FC = () => {
  const { state } = useAppContext();
  const { tagMaster, itemMaster, scanData } = state;
  
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedShelves, setSelectedShelves] = useState<string[]>([]);
  
  // Generate report data
  const allData = useMemo(() => {
    return generateDetailedScanReport(itemMaster, scanData, tagMaster);
  }, [itemMaster, scanData, tagMaster]);
  
  // Get unique TAGs from scan data for dropdown
  const uniqueTags = useMemo(() => {
    return getUniqueTags(scanData);
  }, [scanData]);
  
  // Get unique SHELVEs for selected TAGs from scan data
  const uniqueShelves = useMemo(() => {
    if (selectedTags.length === 0) return [];
    return getUniqueShelvesByTags(scanData, selectedTags);
  }, [scanData, selectedTags]);
  
  // Filter data by selected TAGs and SHELVEs
  const filteredData = useMemo(() => {
    return filterByMultipleTagsAndShelves(allData, selectedTags, selectedShelves);
  }, [allData, selectedTags, selectedShelves]);
  
  const handleTagChange = (tags: string[]) => {
    setSelectedTags(tags);
    setSelectedShelves([]); // Reset shelves when tags change
  };
  
  const handleShelfChange = (shelves: string[]) => {
    setSelectedShelves(shelves);
  };
  
  // Updated columns - Added SHELF column
  const columns = [
    { header: 'TAG', accessor: 'TAG' },
    { header: 'SHELF', accessor: 'SHELF' },
    { header: 'SKU', accessor: 'SKU' },
    { header: 'UPC', accessor: 'UPC' },
    { header: 'DESCRIPTION', accessor: 'DESCRIPTION' },
    { header: 'QTY', accessor: 'QUANTITY' },
  ];

  return (
    <div className="max-w-full mx-auto">
      <ReportHeader title="DETAILED SCAN REPORT" />
      
      <motion.div className="mb-6">
        <CustomerInfoForm readOnly />
      </motion.div>
      
      <motion.div className="mb-6 space-y-4">
        {/* Multi-select dropdowns with search */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-6 space-y-4 lg:space-y-0">
          <MultiSelectDropdown
            options={uniqueTags}
            selectedOptions={selectedTags}
            onSelectionChange={handleTagChange}
            label="TAG"
            placeholder="Select TAGs"
          />
          
          <MultiSelectDropdown
            options={uniqueShelves}
            selectedOptions={selectedShelves}
            onSelectionChange={handleShelfChange}
            label="SHELF"
            placeholder={selectedTags.length === 0 ? "Select TAGs first" : "Select SHELVEs"}
            disabled={selectedTags.length === 0}
          />
        </div>
        
        {/* Download buttons */}
        <div className="flex justify-end">
          <DownloadButtons
            reportData={filteredData}
            columns={columns}
            reportTitle="Detailed_Scan_Report"
          />
        </div>
      </motion.div>
      
      <motion.div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <ReportTable 
          data={filteredData}
          columns={columns}
          showAllInExport={true}
        />
      </motion.div>
    </div>
  );
};

export default DetailedScanReport;