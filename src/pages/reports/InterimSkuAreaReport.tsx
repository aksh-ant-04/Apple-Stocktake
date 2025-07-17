import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';
import { 
  generateInterimSkuAreaReport,
  getUniqueTags,
  getUniqueShelvesByTags,
  filterInterimSkuAreaReport
} from '../../utils/dataProcessing';
import CustomerInfoForm from '../../components/common/CustomerInfoForm';
import ReportHeader from '../../components/common/ReportHeader';
import DownloadButtons from '../../components/common/DownloadButtons';
import ReportTable from '../../components/common/ReportTable';
import MultiSelectDropdown from '../../components/common/MultiSelectDropdown';

const InterimSkuAreaReport: React.FC = () => {
  const { state } = useAppContext();
  const { scanData, tagMaster } = state; // tagMaster is the ITEM MASTER file (SKU, UPC, DESCRIPTION)
  
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedShelves, setSelectedShelves] = useState<string[]>([]);
  
  // Generate all report data
  const allData = useMemo(() => {
    return generateInterimSkuAreaReport(scanData, tagMaster);
  }, [scanData, tagMaster]);
  
  // Get unique TAGs for first dropdown
  const uniqueTags = useMemo(() => {
    return getUniqueTags(scanData);
  }, [scanData]);
  
  // Get unique SHELVEs for selected TAGs
  const uniqueShelves = useMemo(() => {
    if (selectedTags.length === 0) return [];
    return getUniqueShelvesByTags(scanData, selectedTags);
  }, [scanData, selectedTags]);
  
  // Filter data based on selected TAGs and SHELVEs
  const filteredData = useMemo(() => {
    return filterInterimSkuAreaReport(allData, selectedTags, selectedShelves);
  }, [allData, selectedTags, selectedShelves]);
  
  const handleTagChange = (tags: string[]) => {
    setSelectedTags(tags);
    setSelectedShelves([]); // Reset shelves when tags change
  };
  
  const handleShelfChange = (shelves: string[]) => {
    setSelectedShelves(shelves);
  };
  
  // Updated columns with new AUDITED QTY and REMARKS columns
  const columns = [
    { header: 'TAG', accessor: 'TAG' },
    { header: 'SHELF', accessor: 'SHELF' },
    { header: 'UPC', accessor: 'UPC' },
    { header: 'DESCRIPTION', accessor: 'DESCRIPTION' },
    { header: 'SKU', accessor: 'SKU' },
    { header: 'QTY', accessor: 'QUANTITY' },
    { header: 'AUDITED QTY', accessor: 'AUDITED_QTY' },
    { header: 'REMARKS', accessor: 'REMARKS' },
  ];

  return (
    <div className="max-w-full mx-auto">
      <ReportHeader title="INTERIM SKU AREA REPORT" />
      
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
            reportTitle="Interim_SKU_Area_Report"
            showCustomerInfo={true}
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

export default InterimSkuAreaReport;