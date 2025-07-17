import React from 'react';

interface AcrebisLogoProps {
  className?: string;
}

const AcrebisLogo: React.FC<AcrebisLogoProps> = ({ className = '' }) => {
  return (
    <div className={`text-acrebis font-bold text-3xl ${className}`} style={{ fontFamily: 'Calibri, sans-serif' }}>
      acrebis
    </div>
  );
};

export default AcrebisLogo;