import React from 'react';
import { motion } from 'framer-motion';

interface Column {
  header: string;
  accessor: string;
}

interface ReportTableProps {
  data: any[];
  columns: Column[];
  showAllInExport?: boolean;
}

const ReportTable: React.FC<ReportTableProps> = ({ 
  data, 
  columns,
  showAllInExport = true 
}) => {
  const displayData = data;

  return (
    <>
      {showAllInExport && data.length > 10 && (
        <motion.div 
          className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-sm text-blue-700">
            All {data.length} rows will be included in the exported files.
          </p>
        </motion.div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-black text-white">
              {columns.map(column => (
                <th 
                  key={column.accessor} 
                  className={`px-4 py-2 text-sm font-medium border-r border-gray-600 last:border-r-0 whitespace-nowrap ${
                    column.header === 'QTY' || column.header === 'QUANTITY' || column.header === 'VERIFIED QTY' || column.header === 'AUDITED QTY'
                      ? 'text-center' 
                      : 'text-left'
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayData.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length} 
                  className="px-4 py-4 text-center text-gray-500"
                >
                  No data available
                </td>
              </tr>
            ) : (
              displayData.map((row, index) => {
                // Determine row type for styling
                const isSubtotal = row.TAG_SUB_AREA?.startsWith('Sub total of SHELF');
                const isGrandTotal = row.TAG_SUB_AREA === 'GRAND TOTAL' || row.UPC === 'GRAND TOTAL' || row.TAG === 'GRAND TOTAL';
                const isShelfTotal = row.DESCRIPTION?.includes('SHELF') && row.DESCRIPTION?.includes('TOTAL');
                const isTagTotal = row.DESCRIPTION?.includes('TAG') && row.DESCRIPTION?.includes('TOTAL') && !isShelfTotal;
                
                return (
                  <tr 
                    key={index}
                    className={`
                      border-b border-gray-200 
                      ${isSubtotal
                        ? 'bg-blue-50 border-blue-200' 
                        : isGrandTotal
                        ? 'bg-green-100 border-green-300'
                        : isShelfTotal
                        ? 'bg-yellow-50 border-yellow-200'
                        : isTagTotal
                        ? 'bg-orange-50 border-orange-200'
                        : 'hover:bg-gray-50'
                      }
                    `}
                  >
                    {columns.map(column => {
                      const cellValue = row[column.accessor];
                      const isQuantityColumn = column.header === 'QTY' || column.header === 'QUANTITY' || column.header === 'VERIFIED QTY' || column.header === 'AUDITED QTY';
                      
                      return (
                        <td 
                          key={column.accessor} 
                          className={`px-4 py-2 ${
                            column.accessor === 'DESCRIPTION' 
                              ? 'max-w-md truncate' 
                              : 'whitespace-nowrap'
                          } ${
                            isQuantityColumn ? 'text-center' : ''
                          } ${
                            isSubtotal
                              ? 'text-blue-700 font-bold text-sm'
                              : isGrandTotal
                              ? 'text-green-800 font-bold text-lg'
                              : isShelfTotal
                              ? 'text-yellow-700 font-semibold text-sm'
                              : isTagTotal
                              ? 'text-orange-700 font-bold text-sm'
                              : 'text-gray-900'
                          }`}
                        >
                          {/* Special handling for SHELF column to show subtotal and grand total text */}
                          {column.accessor === 'SHELF' && (isSubtotal || isGrandTotal) ? (
                            <span className={`
                              ${isSubtotal ? 'text-blue-700 font-bold' : ''}
                              ${isGrandTotal ? 'text-green-800 font-bold text-lg' : ''}
                            `}>
                              {isSubtotal ? row.TAG_SUB_AREA : 'GRAND TOTAL'}
                            </span>
                          ) : column.accessor === 'DESCRIPTION' && (isShelfTotal || isTagTotal) ? (
                            <span className={`
                              ${isShelfTotal ? 'text-yellow-700 font-semibold' : ''}
                              ${isTagTotal ? 'text-orange-700 font-bold' : ''}
                            `}>
                              {cellValue}
                            </span>
                          ) : (
                            cellValue
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ReportTable;