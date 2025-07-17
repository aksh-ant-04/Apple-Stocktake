import React from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';
import { generateTagSummaryReport } from '../../utils/dataProcessing';
import SimpleReportHeader from '../../components/common/SimpleReportHeader';
import DownloadButtons from '../../components/common/DownloadButtons';
import ReportTable from '../../components/common/ReportTable';

const TagSummaryReport: React.FC = () => {
  const { state } = useAppContext();
  const { itemMaster, scanData, tagMaster } = state;
  
  const reportData = generateTagSummaryReport(itemMaster, scanData, tagMaster);
  
  // Updated columns - Added SHELF column and changed QUANTITY to QTY
  const columns = [
    { header: 'TAG', accessor: 'TAG' },
    { header: 'SHELF', accessor: 'SHELF' },
    { header: 'TAG DESCRIPTION', accessor: 'TAG_AREA_DESCRIPTION' }, // Changed from TAG AREA DESCRIPTION
    { header: 'QTY', accessor: 'QUANTITY' }, // Changed from QUANTITY to QTY
  ];

  return (
    <div className="max-w-full mx-auto">
      <SimpleReportHeader title="TAG SUMMARY REPORT" />
      
      {/* Removed CustomerInfoForm - no customer information in this report */}
      
      <motion.div className="mb-6 flex justify-end">
        <DownloadButtons
          reportData={reportData}
          columns={columns}
          reportTitle="Tag_Summary_Report"
          showCustomerInfo={false} // Don't show customer info in exports
        />
      </motion.div>
      
      <motion.div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <ReportTable 
          data={reportData}
          columns={columns}
          showAllInExport={true}
        />
      </motion.div>
    </div>
  );
};

export default TagSummaryReport;