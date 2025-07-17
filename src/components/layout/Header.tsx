import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';
import AppleLogo from '../common/AppleLogo';
import AcrebisLogo from '../common/AcrebisLogo';

const Header: React.FC = () => {
  const location = useLocation();
  const { state, setActiveReport } = useAppContext();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex justify-between items-center">
          <AppleLogo width={40} height={40} />
          <AcrebisLogo />
        </div>
        
        {state.isDataLoaded && (
          <motion.nav 
            className="mt-6 flex flex-wrap gap-2 sm:gap-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <NavLink 
              to="/" 
              isActive={isActive('/')} 
              onClick={() => setActiveReport('')}
            >
              Dashboard
            </NavLink>
            <NavLink 
              to="/reports/all-product" 
              isActive={isActive('/reports/all-product')} 
              onClick={() => setActiveReport('all-product')}
            >
              All Product Report
            </NavLink>
            <NavLink 
              to="/reports/sku-upc" 
              isActive={isActive('/reports/sku-upc')} 
              onClick={() => setActiveReport('sku-upc')}
            >
              SKUUPC00R669
            </NavLink>
            <NavLink 
              to="/reports/sku-tag" 
              isActive={isActive('/reports/sku-tag')} 
              onClick={() => setActiveReport('sku-tag')}
            >
              SKUTAG00R669
            </NavLink>
            <NavLink 
              to="/reports/tag-summary" 
              isActive={isActive('/reports/tag-summary')} 
              onClick={() => setActiveReport('tag-summary')}
            >
              Tag Summary Report
            </NavLink>
            <NavLink 
              to="/reports/detailed-scan" 
              isActive={isActive('/reports/detailed-scan')} 
              onClick={() => setActiveReport('detailed-scan')}
            >
              Detailed Scan Report
            </NavLink>
            <NavLink 
              to="/reports/nof" 
              isActive={isActive('/reports/nof')} 
              onClick={() => setActiveReport('nof')}
            >
              NOF Report
            </NavLink>
            <NavLink 
              to="/reports/interim-sku-area" 
              isActive={isActive('/reports/interim-sku-area')} 
              onClick={() => setActiveReport('interim-sku-area')}
            >
              Interim SKU Area Report
            </NavLink>
          </motion.nav>
        )}
      </div>
    </header>
  );
};

interface NavLinkProps {
  to: string;
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ to, isActive, onClick, children }) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`relative px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? 'text-primary-700 bg-primary-50'
          : 'text-gray-600 hover:text-primary-600 hover:bg-primary-50'
      }`}
    >
      {children}
      {isActive && (
        <motion.div
          className="absolute bottom-0 left-0 h-0.5 bg-primary-500 w-full"
          layoutId="activeIndicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </Link>
  );
};

export default Header;