import React from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';
import { generateSkuTagReport } from '../../utils/dataProcessing';
import SimpleReportHeader from '../../components/common/SimpleReportHeader';
import DownloadButtons from '../../components/common/DownloadButtons';
import ReportTable from '../../components/common/ReportTable';

const SkuTagReport: React.FC = () => {
  const { state } = useAppContext();
  const { tagMaster, itemMaster, scanData } = state;
  
  const reportData = generateSkuTagReport(tagMaster, itemMaster, scanData);
  
  const columns = [
    { header: 'TAG', accessor: 'TAG' },
    { header: 'SKU', accessor: 'SKU' },
    { header: 'QTY', accessor: 'QUANTITY' },
  ];

  return (
    <div className="max-w-full mx-auto">
      <SimpleReportHeader title="SKUTAG00R669" />
      
      <motion.div className="mb-6 flex justify-end">
        <DownloadButtons
          reportData={reportData}
          columns={columns}
          reportTitle="SKUTAG00R669"
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

export default SkuTagReport;