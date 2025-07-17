import React from 'react';
import { motion } from 'framer-motion';
import AppleLogo from './AppleLogo';
import AcrebisLogo from './AcrebisLogo';

interface ReportHeaderProps {
  title: string;
}

const ReportHeader: React.FC<ReportHeaderProps> = ({ title }) => {
  return (
    <motion.div 
      className="mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center mb-4">
        <AppleLogo width={50} height={50} />
        <h1 className="text-2xl font-bold text-center uppercase">{title}</h1>
        <AcrebisLogo />
      </div>
    </motion.div>
  );
};

export default ReportHeader;