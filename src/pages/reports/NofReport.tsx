import React from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';
import { generateNofReport } from '../../utils/dataProcessing';
import SimpleReportHeader from '../../components/common/SimpleReportHeader';
import DownloadButtons from '../../components/common/DownloadButtons';
import ReportTable from '../../components/common/ReportTable';

const NofReport: React.FC = () => {
  const { state } = useAppContext();
  const { scanData, tagMaster } = state; // tagMaster is the ITEM MASTER file (SKU, UPC, DESCRIPTION)
  
  const reportData = generateNofReport(scanData, tagMaster); // Pass tagMaster as ITEM MASTER
  
  const columns = [
    { header: 'UPC', accessor: 'UPC' }, // Changed from SKU to UPC
    { header: 'TAG', accessor: 'TAG' },
    { header: 'QTY', accessor: 'QUANTITY' },
  ];

  return (
    <div className="max-w-full mx-auto">
      <SimpleReportHeader title="NOF REPORT" />
      
      <motion.div className="mb-6 flex justify-end">
        <DownloadButtons
          reportData={reportData}
          columns={columns}
          reportTitle="NOF_Report"
          showCustomerInfo={false}
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

export default NofReport;