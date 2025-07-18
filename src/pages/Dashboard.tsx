import React from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import EventSelection from '../components/common/EventSelection';
import CustomerInfoForm from '../components/common/CustomerInfoForm';
import FileUploader from '../components/common/FileUploader';

const Dashboard: React.FC = () => {
  const { state, resetData, setActiveReport, resetSignal } = useAppContext();
  const { isDataLoaded } = state;

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      resetData();
    }
  };

  return (
    <div className="max-w-4xl mx-auto relative">
      {/* Reset Dashboard button at top right */}
      <button
        onClick={() => window.location.reload()}
        className="absolute top-0 right-0 mt-4 mr-4 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md shadow hover:bg-red-700 transition-colors z-10"
      >
        Reset Dashboard
      </button>
      <motion.h1 
        className="text-3xl font-bold mb-6 text-gray-800"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        Stocktake Reports
      </motion.h1>

      <EventSelection />

      <motion.div 
        className="bg-white rounded-lg shadow-sm p-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <CustomerInfoForm />
      </motion.div>

      <motion.div 
        className="bg-white rounded-lg shadow-sm p-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <h2 className="text-xl font-semibold mb-4">Upload Excel Files</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FileUploader 
            fileType="tagMaster" 
            label="Upload ITEM MASTER" 
            resetSignal={resetSignal}
          />
          <FileUploader 
            fileType="itemMaster" 
            label="Upload TAG MASTER" 
            resetSignal={resetSignal}
          />
          <FileUploader 
            fileType="scanData" 
            label="Upload SCAN DATA" 
            resetSignal={resetSignal}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Reset All Data
          </button>
        </div>
      </motion.div>

      {isDataLoaded ? (
        <motion.div 
          className="bg-white rounded-lg shadow-sm p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <h2 className="text-xl font-semibold mb-4">Available Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReportCard 
              title="All Product Report" 
              description="Complete product inventory with detailed information"
              path="/reports/all-product"
              onClick={() => setActiveReport('all-product')}
            />
            <ReportCard 
              title="SKUUPC00R669" 
              description="SKU and UPC relationships with quantities"
              path="/reports/sku-upc"
              onClick={() => setActiveReport('sku-upc')}
            />
            <ReportCard 
              title="SKUTAG00R669" 
              description="SKU and TAG relationships with quantities"
              path="/reports/sku-tag"
              onClick={() => setActiveReport('sku-tag')}
            />
            <ReportCard 
              title="Tag Summary Report" 
              description="Summary of quantities by TAG and TAG SUB AREA"
              path="/reports/tag-summary"
              onClick={() => setActiveReport('tag-summary')}
            />
            <ReportCard 
              title="Detailed Scan Report" 
              description="Detailed scan information with TAG and SKU data"
              path="/reports/detailed-scan"
              onClick={() => setActiveReport('detailed-scan')}
            />
            <ReportCard 
              title="NOF Report" 
              description="SKU, TAG, and quantity relationships"
              path="/reports/nof"
              onClick={() => setActiveReport('nof')}
            />
            <ReportCard 
              title="Interim SKU Area Report" 
              description="TAG, SHELF, UPC, Description, SKU, and quantity data"
              path="/reports/interim-sku-area"
              onClick={() => setActiveReport('interim-sku-area')}
            />
          </div>
        </motion.div>
      ) : (
        <motion.div 
          className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-accent-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Data Available</h2>
            <p className="text-gray-600 mb-4">
              Please upload all three Excel files to generate reports.
            </p>
            <div className="flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary-500 mr-2" />
              <span className="text-primary-600">Upload Files to Get Started</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Data Summary Segment */}
      <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
        <h2 className="text-2xl font-semibold mb-4">Data Summary</h2>
        <div className="flex flex-wrap gap-4">
          {/* Current Event ID */}
          <div className="flex-1 min-w-[180px] bg-blue-50 rounded-xl p-6 flex flex-col justify-center items-start">
            <span className="text-md text-gray-700 mb-1">Current Event ID</span>
            <span className="text-2xl font-bold text-blue-700">{state.customerInfo.eventId || '-'}</span>
          </div>
          {/* Total Locations */}
          <div className="flex-1 min-w-[180px] bg-blue-50 rounded-xl p-6 flex flex-col justify-center items-start">
            <span className="text-md text-gray-700 mb-1">Total Locations</span>
            <span className="text-2xl font-bold text-blue-700">{state.customerInfo.totalStocktakeLocation || 0}</span>
          </div>
          {/* Item Master Records */}
          <div className="flex-1 min-w-[180px] bg-green-50 rounded-xl p-6 flex flex-col justify-center items-start">
            <span className="text-md text-gray-700 mb-1">Item Master Records</span>
            <span className="text-2xl font-bold text-green-600">{state.itemMaster.length}</span>
          </div>
          {/* Scan Data Records */}
          <div className="flex-1 min-w-[180px] bg-purple-50 rounded-xl p-6 flex flex-col justify-center items-start">
            <span className="text-md text-gray-700 mb-1">Scan Data Records</span>
            <span className="text-2xl font-bold text-purple-600">{state.scanData.length}</span>
          </div>
          {/* Completed Locations */}
          <div className="flex-1 min-w-[180px] bg-orange-50 rounded-xl p-6 flex flex-col justify-center items-start">
            <span className="text-md text-gray-700 mb-1">Completed Locations</span>
            <span className="text-2xl font-bold text-orange-600">{state.scanData.length > 0 ? [...new Set(state.scanData.map(item => item.SHELF))].filter(Boolean).length : 0}</span>
          </div>
          {/* Total Quantity */}
          <div className="flex-1 min-w-[180px] bg-teal-50 rounded-xl p-6 flex flex-col justify-center items-start">
            <span className="text-md text-gray-700 mb-1">Total Quantity</span>
            <span className="text-2xl font-bold text-teal-600">{state.scanData.reduce((sum, item) => sum + (Number(item.QTY ?? item.QUANTITY) || 0), 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ReportCardProps {
  title: string;
  description: string;
  path: string;
  onClick: () => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ title, description, path, onClick }) => {
  return (
    <Link
      to={path}
      onClick={onClick}
      className="block bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-primary-400 hover:shadow-md transition-all"
    >
      <div className="flex items-center">
        <FileText className="w-10 h-10 text-primary-500 mr-4" />
        <div>
          <h3 className="font-medium text-gray-800">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </Link>
  );
};

export default Dashboard;