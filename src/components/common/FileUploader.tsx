import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAppContext } from '../../context/AppContext';
import { TagMaster, ItemMaster, ScanData } from '../../types';

interface FileUploaderProps {
  fileType: 'tagMaster' | 'itemMaster' | 'scanData';
  label: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({ fileType, label }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { setTagMaster, setItemMaster, setScanData } = useAppContext();

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const data = await readExcelFile(file);
      
      if (data && data.length > 0) {
        processData(data);
        setIsSuccess(true);
      } else {
        setError('No data found in the file');
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to process the file');
      setIsSuccess(false);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error('Failed to read file'));
            return;
          }
          
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          
          resolve(json);
        } catch (err) {
          reject(err);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsBinaryString(file);
    });
  };

  const processData = (data: any[]) => {
    const processedData = data.map(item => {
      // Convert all keys to uppercase for consistency
      const processedItem: Record<string, any> = {};
      
      Object.keys(item).forEach(key => {
        const upperKey = key.toUpperCase().replace(/\s+/g, '_');
        let value = item[key];
        
        // Ensure UPC values are always strings for tagMaster and scanData
        if (upperKey === 'UPC' && (fileType === 'tagMaster' || fileType === 'scanData') && typeof value === 'number') {
          value = String(value);
        }
        
        // Ensure TAG values are always strings for itemMaster and scanData
        if (upperKey === 'TAG' && (fileType === 'itemMaster' || fileType === 'scanData') && typeof value === 'number') {
          value = String(value);
        }
        
        // Ensure SHELF values are always strings for itemMaster and scanData
        if (upperKey === 'SHELF' && (fileType === 'itemMaster' || fileType === 'scanData') && typeof value === 'number') {
          value = String(value);
        }
        
        // SPECIAL CASE: For ITEM MASTER file, ensure SKU is always a string for NOF Report comparison
        if (upperKey === 'SKU' && fileType === 'itemMaster' && typeof value === 'number') {
          value = String(value);
        }
        
        // SPECIAL CASE: For SCAN DATA file, ensure TAG is always a string to prevent undefined errors
        if (upperKey === 'TAG' && fileType === 'scanData') {
          value = value != null ? String(value) : '';
        }
        
        // SPECIAL CASE: For SCAN DATA file, ensure SHELF is always a string
        if (upperKey === 'SHELF' && fileType === 'scanData') {
          value = value != null ? String(value) : '';
        }
        
        // SPECIAL CASE: For SCAN DATA file, handle both QTY and QUANTITY fields
        if ((upperKey === 'QTY' || upperKey === 'QUANTITY') && fileType === 'scanData') {
          // Ensure it's a number
          if (typeof value === 'string') {
            value = parseFloat(value) || 0;
          }
          value = Number(value) || 0;
          
          // Store both QTY and QUANTITY for compatibility
          processedItem['QTY'] = value;
          processedItem['QUANTITY'] = value;
        }
        
        processedItem[upperKey] = value;
      });
      
      return processedItem;
    });
    
    switch (fileType) {
      case 'tagMaster':
        setTagMaster(processedData as TagMaster[]);
        break;
      case 'itemMaster':
        setItemMaster(processedData as ItemMaster[]);
        break;
      case 'scanData':
        setScanData(processedData as ScanData[]);
        break;
    }
  };

  return (
    <motion.div 
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls"
        className="hidden"
      />
      
      <button
        onClick={handleClick}
        disabled={isUploading}
        className={`
          flex flex-col items-center justify-center w-full h-32 p-4 
          border-2 border-dashed rounded-lg transition-colors
          ${isSuccess 
            ? 'border-success-500 bg-success-50' 
            : error 
              ? 'border-error-500 bg-error-50' 
              : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50'
          }
        `}
      >
        <div className="flex items-center justify-center mb-2">
          {isSuccess ? (
            <CheckCircle className="w-8 h-8 text-success-500" />
          ) : error ? (
            <AlertCircle className="w-8 h-8 text-error-500" />
          ) : (
            <>
              {isUploading ? (
                <div className="w-8 h-8 border-2 border-t-primary-500 border-r-primary-500 border-b-primary-200 border-l-primary-200 rounded-full animate-spin" />
              ) : (
                <FileText className="w-8 h-8 text-gray-400" />
              )}
            </>
          )}
        </div>
        
        <div className="text-center">
          <span className="block font-medium">
            {isSuccess
              ? 'File uploaded successfully'
              : error
              ? 'Error uploading file'
              : label}
          </span>
          <span className="text-sm text-gray-500 mt-1 block">
            {isSuccess
              ? 'Data processed'
              : error
              ? error
              : isUploading
              ? 'Processing...'
              : 'Click to browse'}
          </span>
        </div>
      </button>
    </motion.div>
  );
};

export default FileUploader;