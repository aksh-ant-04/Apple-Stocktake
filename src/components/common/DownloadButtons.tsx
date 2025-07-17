import React from 'react';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAppContext } from '../../context/AppContext';

interface DownloadButtonsProps {
  reportData: any[];
  columns: { header: string; accessor: string }[];
  reportTitle: string;
  showCustomerInfo?: boolean;
}

const DownloadButtons: React.FC<DownloadButtonsProps> = ({ 
  reportData, 
  columns,
  reportTitle,
  showCustomerInfo = true
}) => {
  const { state } = useAppContext();
  const { customerInfo } = state;

  const exportToExcel = () => {
    try {
      const chunkSize = 1000;
      const workbook = XLSX.utils.book_new();
      
      let excelData: any[] = [];
      
      // Add customer info only if showCustomerInfo is true
      if (showCustomerInfo) {
        const customerInfoRows = [
          ['Event ID', customerInfo.eventId, 'Date of Stock Take', customerInfo.dateOfStockTake],
          ['Customer Name', customerInfo.customerName, 'Time of Stock Take', customerInfo.timeOfStockTake],
          ['Outlet Address', customerInfo.outletAddress, '', ''],
          ['ACREBIS Supervisor', customerInfo.acrebisSupervisor, 'Customer Supervisor', customerInfo.customerSupervisor],
          ['Total Stocktake Location', customerInfo.totalStocktakeLocation.toString(), '', ''],
          ['', '', '', ''],
        ];
        excelData = [...customerInfoRows];
      }

      const headers = columns.map(col => col.header);
      excelData.push(headers);
      
      for (let i = 0; i < reportData.length; i += chunkSize) {
        const chunk = reportData.slice(i, i + chunkSize);
        const rows = chunk.map(row => {
          return columns.map(col => {
            // Special handling for SHELF column to show subtotal and grand total text
            if (col.accessor === 'SHELF') {
              const isSubtotal = row.TAG_SUB_AREA?.startsWith('Sub total of SHELF');
              const isGrandTotal = row.TAG_SUB_AREA === 'GRAND TOTAL' || row.UPC === 'GRAND TOTAL' || row.TAG === 'GRAND TOTAL';
              
              if (isSubtotal) {
                return row.TAG_SUB_AREA;
              } else if (isGrandTotal) {
                return 'GRAND TOTAL';
              }
            }
            return row[col.accessor];
          });
        });
        excelData.push(...rows);
      }
      
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      
      // Apply styling to subtotal and grand total rows
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      
      const customerInfoRowCount = showCustomerInfo ? 6 : 0;
      
      for (let rowNum = customerInfoRowCount + 1; rowNum <= range.e.r; rowNum++) {
        const dataRowIndex = rowNum - customerInfoRowCount - 1;
        if (dataRowIndex >= 0 && dataRowIndex < reportData.length) {
          const row = reportData[dataRowIndex];
          
          // Check if this is a subtotal, shelf total, tag total, or grand total row
          const isSubtotal = row.TAG_SUB_AREA?.startsWith('Sub total of SHELF');
          const isGrandTotal = row.TAG_SUB_AREA === 'GRAND TOTAL' || row.UPC === 'GRAND TOTAL' || row.TAG === 'GRAND TOTAL';
          const isShelfTotal = row.DESCRIPTION?.includes('SHELF') && row.DESCRIPTION?.includes('TOTAL');
          const isTagTotal = row.DESCRIPTION?.includes('TAG') && row.DESCRIPTION?.includes('TOTAL') && !isShelfTotal;
          
          if (isSubtotal || isGrandTotal || isShelfTotal || isTagTotal) {
            // Apply formatting to each cell in the row
            for (let colNum = range.s.c; colNum <= range.e.c; colNum++) {
              const cellAddress = XLSX.utils.encode_cell({ r: rowNum, c: colNum });
              
              if (!ws[cellAddress]) {
                ws[cellAddress] = { t: 's', v: '' };
              }
              
              // Set cell style based on total type
              let fillColor = 'DBEAFE'; // Default blue for subtotals
              let fontSize = 12;
              
              if (isGrandTotal) {
                fillColor = 'C6EFCE'; // Green for grand total
                fontSize = 14;
              } else if (isShelfTotal) {
                fillColor = 'FEF3C7'; // Yellow for shelf totals
                fontSize = 12;
              } else if (isTagTotal) {
                fillColor = 'FED7AA'; // Orange for tag totals
                fontSize = 13;
              }
              
              ws[cellAddress].s = {
                font: { 
                  bold: true,
                  sz: fontSize
                },
                fill: {
                  fgColor: { rgb: fillColor }
                },
                border: {
                  top: { style: 'thin', color: { rgb: '000000' } },
                  bottom: { style: 'thin', color: { rgb: '000000' } },
                  left: { style: 'thin', color: { rgb: '000000' } },
                  right: { style: 'thin', color: { rgb: '000000' } }
                }
              };
            }
          }
        }
      }
      
      // Apply center alignment to QTY columns
      for (let colNum = range.s.c; colNum <= range.e.c; colNum++) {
        const columnHeader = columns[colNum]?.header;
        if (columnHeader === 'QTY' || columnHeader === 'QUANTITY' || columnHeader === 'VERIFIED QTY' || columnHeader === 'AUDITED QTY') {
          // Apply center alignment to all cells in this column
          for (let rowNum = customerInfoRowCount + 1; rowNum <= range.e.r; rowNum++) {
            const cellAddress = XLSX.utils.encode_cell({ r: rowNum, c: colNum });
            
            if (!ws[cellAddress]) {
              ws[cellAddress] = { t: 's', v: '' };
            }
            
            // Preserve existing style or create new one
            if (!ws[cellAddress].s) {
              ws[cellAddress].s = {};
            }
            
            ws[cellAddress].s.alignment = {
              horizontal: 'center'
            };
          }
        }
      }
      
      XLSX.utils.book_append_sheet(workbook, ws, reportTitle);
      XLSX.writeFile(workbook, `${reportTitle}.xlsx`);
    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Failed to generate Excel file. Please try again with a smaller dataset.');
    }
  };

  const exportToPdf = () => {
    try {
      const useLandscape = reportTitle === 'All_Product_Report' || reportTitle === 'Detailed_Scan_Report' || reportTitle === 'Interim_SKU_Area_Report';
      const doc = new jsPDF({
        orientation: useLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      const headerHeight = showCustomerInfo ? 60 : 35; // Adjust as needed
      
      // Add logos and title
      if (customerInfo.logo) {
        doc.addImage(customerInfo.logo, 'JPEG', margin, margin, 15, 15);
      }
      
      // Move acrebis text further to the right
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 0, 0);
      doc.text('acrebis', pageWidth - margin - 5, margin + 10, { align: 'right' });
      
      doc.setTextColor(0);
      doc.setFontSize(16);
      doc.text(reportTitle.replace(/_/g, ' ').toUpperCase(), pageWidth/2, margin + 15, { align: 'center' });
      
      let startY = margin + 25;
      
      // Add customer info only if showCustomerInfo is true
      if (showCustomerInfo) {
        autoTable(doc, {
          startY: startY,
          head: [],
          body: [
            ['Event ID', customerInfo.eventId, 'Date of Stock Take', customerInfo.dateOfStockTake],
            ['Customer Name', customerInfo.customerName, 'Time of Stock Take', customerInfo.timeOfStockTake],
            ['Outlet Address', customerInfo.outletAddress],
            ['ACREBIS Supervisor', customerInfo.acrebisSupervisor, 'Customer Supervisor', customerInfo.customerSupervisor, 'Total Stocktake Location', customerInfo.totalStocktakeLocation.toString()],
            ['Total Stocktake Location', customerInfo.totalStocktakeLocation.toString(), '', ''],
          ],
          theme: 'grid',
          styles: {
            fontSize: 8,
            cellPadding: 2,
          },
          columnStyles: {
            0: { fontStyle: 'bold', fillColor: [240, 240, 240], width: 30 },
            1: { width: useLandscape ? 70 : 45 },
            2: { fontStyle: 'bold', fillColor: [240, 240, 240], width: 30 },
            3: { width: useLandscape ? 70 : 45 },
            4: { fontStyle: 'bold', fillColor: [240, 240, 240], width: 30 },
            5: { width: useLandscape ? 45 : 30 },
          },
          didParseCell: (data) => {
            // Special handling for Outlet Address row (row index 2)
            if (data.row.index === 2) {
              // Make Outlet Address span all columns
              if (data.column.index === 1) {
                data.cell.colSpan = useLandscape ? 5 : 3;
              } else if (data.column.index > 1) {
                // Hide other cells in the Outlet Address row
                data.cell.text = [];
              }
            }
          },
        });
        startY = (doc.lastAutoTable?.finalY || startY) + 10;
      }

      // Define column styles based on report type
      const columnStyles = {};
      if (reportTitle === 'All_Product_Report') {
        columnStyles[0] = { width: 30 }; // TAG DESCRIPTION
        columnStyles[1] = { width: 15 }; // TAG
        columnStyles[2] = { width: 15 }; // SHELF
        columnStyles[3] = { width: 35 }; // UPC
        columnStyles[4] = { width: 25 }; // SKU
        columnStyles[5] = { width: 60 }; // DESCRIPTION
        columnStyles[6] = { width: 15, halign: 'center' }; // QTY
        columnStyles[7] = { width: 20, halign: 'center' }; // VERIFIED QTY
        columnStyles[8] = { width: 25 }; // REMARKS
      } else if (reportTitle === 'Detailed_Scan_Report') {
        columnStyles[0] = { width: 15 }; // TAG
        columnStyles[1] = { width: 15 }; // SHELF
        columnStyles[2] = { width: 25 }; // SKU
        columnStyles[3] = { width: 35 }; // UPC
        columnStyles[4] = { width: 80 }; // DESCRIPTION
        columnStyles[5] = { width: 15, halign: 'center' }; // QTY
      } else if (reportTitle === 'Interim_SKU_Area_Report') {
        columnStyles[0] = { width: 15 }; // TAG
        columnStyles[1] = { width: 15 }; // SHELF
        columnStyles[2] = { width: 35 }; // UPC
        columnStyles[3] = { width: 80 }; // DESCRIPTION
        columnStyles[4] = { width: 25 }; // SKU
        columnStyles[5] = { width: 15, halign: 'center' }; // QTY
        columnStyles[6] = { width: 20, halign: 'center' }; // AUDITED QTY
        columnStyles[7] = { width: 30 }; // REMARKS
      }

      // Prepare data for PDF with special handling for SHELF column
      const pdfData = reportData.map(row => {
        return columns.map(col => {
          // Special handling for SHELF column to show subtotal and grand total text
          if (col.accessor === 'SHELF') {
            const isSubtotal = row.TAG_SUB_AREA?.startsWith('Sub total of SHELF');
            const isGrandTotal = row.TAG_SUB_AREA === 'GRAND TOTAL' || row.UPC === 'GRAND TOTAL' || row.TAG === 'GRAND TOTAL';
            
            if (isSubtotal) {
              return row.TAG_SUB_AREA;
            } else if (isGrandTotal) {
              return 'GRAND TOTAL';
            }
          }
          return row[col.accessor];
        });
      });

      // Add report data with conditional row styling
      autoTable(doc, {
        startY: margin + headerHeight, // For the first page
        margin: { top: margin + headerHeight }, // For all pages
        head: [columns.map(col => col.header)],
        body: pdfData,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2,
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
        },
        headStyles: {
          fillColor: [0, 0, 0],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          valign: 'middle',
          fontSize: 8,
        },
        columnStyles: columnStyles,
        didParseCell: (data) => {
          // Set header alignment - center align QTY columns, left align others
          if (data.section === 'head') {
            const columnHeader = columns[data.column.index]?.header;
            if (columnHeader === 'QTY' || columnHeader === 'QUANTITY' || columnHeader === 'VERIFIED QTY' || columnHeader === 'AUDITED QTY') {
              data.cell.styles.halign = 'center';
            } else {
              data.cell.styles.halign = 'left';
            }
          }
          
          // Set body cell alignment and styling
          if (data.section === 'body') {
            const columnHeader = columns[data.column.index]?.header;
            if (columnHeader === 'QTY' || columnHeader === 'QUANTITY' || columnHeader === 'VERIFIED QTY' || columnHeader === 'AUDITED QTY') {
              data.cell.styles.halign = 'center';
            }
            
            const rowIndex = data.row.index;
            if (rowIndex < reportData.length) {
              const row = reportData[rowIndex];
              
              // Check if this is a subtotal, shelf total, tag total, or grand total row
              const isSubtotal = row.TAG_SUB_AREA?.startsWith('Sub total of SHELF');
              const isGrandTotal = row.TAG_SUB_AREA === 'GRAND TOTAL' || row.UPC === 'GRAND TOTAL' || row.TAG === 'GRAND TOTAL';
              const isShelfTotal = row.DESCRIPTION?.includes('SHELF') && row.DESCRIPTION?.includes('TOTAL');
              const isTagTotal = row.DESCRIPTION?.includes('TAG') && row.DESCRIPTION?.includes('TOTAL') && !isShelfTotal;
              
              if (isShelfTotal) {
                // Yellow highlighting for shelf total rows
                data.cell.styles.fillColor = [254, 243, 199]; // Light yellow
                data.cell.styles.textColor = [146, 64, 14]; // Dark yellow/orange text
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fontSize = 9;
              } else if (isTagTotal) {
                // Orange highlighting for tag total rows
                data.cell.styles.fillColor = [254, 215, 170]; // Light orange
                data.cell.styles.textColor = [154, 52, 18]; // Dark orange text
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fontSize = 10;
              } else if (isSubtotal) {
                // Blue highlighting for subtotal rows
                data.cell.styles.fillColor = [219, 234, 254]; // Light blue
                data.cell.styles.textColor = [29, 78, 216]; // Blue text
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fontSize = 9;
              } else if (isGrandTotal) {
                // Green highlighting for grand total row
                data.cell.styles.fillColor = [198, 239, 206]; // Light green
                data.cell.styles.textColor = [22, 101, 52]; // Dark green text
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.fontSize = 10;
              }
            }
          }
        },
        didDrawPage: (data) => {
          // Draw your header at (margin, margin)
          if (customerInfo.logo) {
            doc.addImage(customerInfo.logo, 'JPEG', margin, margin, 15, 15);
          }
          doc.setFontSize(20);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 0, 0);
          doc.text('acrebis', pageWidth - margin - 5, margin + 10, { align: 'right' });

          doc.setTextColor(0);
          doc.setFontSize(16);
          doc.text(reportTitle.replace(/_/g, ' ').toUpperCase(), pageWidth/2, margin + 15, { align: 'center' });

          let startY = margin + 25;

          if (showCustomerInfo) {
            autoTable(doc, {
              startY: startY,
              head: [],
              body: [
                ['Event ID', customerInfo.eventId, 'Date of Stock Take', customerInfo.dateOfStockTake],
                ['Customer Name', customerInfo.customerName, 'Time of Stock Take', customerInfo.timeOfStockTake],
                ['Outlet Address', customerInfo.outletAddress],
                ['ACREBIS Supervisor', customerInfo.acrebisSupervisor, 'Customer Supervisor', customerInfo.customerSupervisor, 'Total Stocktake Location', customerInfo.totalStocktakeLocation.toString()],
              ],
              theme: 'grid',
              styles: {
                fontSize: 7,
                cellPadding: 1.5,
              },
              columnStyles: {
                0: { fontStyle: 'bold', fillColor: [240, 240, 240], width: 25 },
                1: { width: 60 },
                2: { fontStyle: 'bold', fillColor: [240, 240, 240], width: 25 },
                3: { width: 60 },
                4: { fontStyle: 'bold', fillColor: [240, 240, 240], width: 25 },
                5: { width: 40 },
              },
              didParseCell: (data) => {
                if (data.row.index === 2) {
                  if (data.column.index === 1) {
                    data.cell.colSpan = 5;
                  } else if (data.column.index > 1) {
                    data.cell.text = [];
                  }
                }
              },
            });
          }

          // Footer
          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          
          const now = new Date();
          const dateStr = now.toLocaleDateString();
          const timeStr = now.toLocaleTimeString();
          const pageNumber = `Page ${doc.internal.getCurrentPageInfo().pageNumber}`;
          
          doc.text(pageNumber, pageWidth/2, pageHeight - 10, { align: 'center' });
          doc.text(`Generated on ${dateStr} at ${timeStr}`, pageWidth/2, pageHeight - 5, { align: 'center' });
        },
        // Ensure proper spacing for tables that start on pages with headers
        didDrawCell: (data) => {
          // Additional check to prevent overlap on subsequent pages
          if (data.section === 'head' && 
              (reportTitle === 'All_Product_Report' || reportTitle === 'Detailed_Scan_Report' || reportTitle === 'Interim_SKU_Area_Report') &&
              doc.internal.getCurrentPageInfo().pageNumber > 1) {
            
            // Calculate minimum Y position to avoid header overlap
            const minY = showCustomerInfo ? margin + 80 : margin + 40;
            
            // If the table header would overlap with our custom header, move it down
            if (data.cell.y < minY) {
              data.cell.y = minY;
            }
          }
        },
      });
      
      doc.save(`${reportTitle}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF file. Please try again with a smaller dataset.');
    }
  };

  return (
    <div className="flex space-x-2">
      <button
        onClick={exportToExcel}
        className="flex items-center px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
      >
        <Download className="w-4 h-4 mr-2" />
        Excel
      </button>
      <button
        onClick={exportToPdf}
        className="flex items-center px-3 py-2 text-sm font-medium text-white bg-accent-600 rounded-md hover:bg-accent-700 transition-colors"
      >
        <Download className="w-4 h-4 mr-2" />
        PDF
      </button>
    </div>
  );
};

export default DownloadButtons;