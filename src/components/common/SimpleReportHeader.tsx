import React from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';
import AcrebisLogo from './AcrebisLogo';

interface SimpleReportHeaderProps {
  title: string;
}

const SimpleReportHeader: React.FC<SimpleReportHeaderProps> = ({ title }) => {
  const { state } = useAppContext();
  const { customerInfo } = state;

  return (
    <motion.div 
      className="mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center mb-4">
        {customerInfo.logo ? (
          <img 
            src={customerInfo.logo} 
            alt="Company Logo" 
            className="h-12 object-contain"
          />
        ) : (
          <div className="w-12 h-12" />
        )}
        <h1 className="text-2xl font-bold text-center uppercase">{title}</h1>
        <AcrebisLogo />
      </div>
    </motion.div>
  );
};

export default SimpleReportHeader;