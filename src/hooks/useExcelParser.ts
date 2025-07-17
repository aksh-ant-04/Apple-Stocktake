import { useState } from 'react';
import * as XLSX from 'xlsx';

interface ExcelParserResult<T> {
  parse: (file: File) => Promise<T[]>;
  isLoading: boolean;
  error: string | null;
}

function useExcelParser<T>(): ExcelParserResult<T> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parse = async (file: File): Promise<T[]> => {
    setIsLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            const error = new Error('Failed to read file');
            setError(error.message);
            setIsLoading(false);
            reject(error);
            return;
          }
          
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json<T>(worksheet);
          
          setIsLoading(false);
          resolve(json);
        } catch (err) {
          const error = err as Error;
          setError(error.message);
          setIsLoading(false);
          reject(error);
        }
      };
      
      reader.onerror = () => {
        const error = new Error('Error reading file');
        setError(error.message);
        setIsLoading(false);
        reject(error);
      };
      
      reader.readAsBinaryString(file);
    });
  };

  return { parse, isLoading, error };
}

export default useExcelParser;