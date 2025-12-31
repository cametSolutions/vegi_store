// import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format as formatDate } from 'date-fns';

// Helper function for currency formatting (placed outside to avoid hoisting issues)
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const downloadHelper = {
  /**
   * Generate Excel File with Dynamic Headers
   */
  // generateExcel: (data, fileName, context = {}) => {
  //   const type = context.type || 'sale';
  //   const isSale = type === 'sale';
    
  //   // Dynamic Configuration
  //   const mainHeader = isSale ? "Sales" : "Purchase";
  //   const returnHeader = isSale ? "Sales Return" : "Purchase Return";
  //   const mainKey = isSale ? "sale" : "purchase";
  //   const returnKey = isSale ? "salesReturn" : "purchaseReturn";

  //   // Flatten Data
  //   const rows = data.map((item, index) => ({
  //     '#': index + 1,
  //     'Account Name': item.accountName || '-',
  //     'Email': item.email || '-',
  //     'Phone': item.phoneNo || '-',
  //     [mainHeader]: item.summary?.breakdown?.[mainKey] || 0,
  //     [returnHeader]: item.summary?.breakdown?.[returnKey] || 0,
  //   }));

  //   // Create Sheet
  //   const worksheet = XLSX.utils.json_to_sheet(rows);

  //   // Auto-adjust Column Widths
  //   const wscols = [
  //     { wch: 5 },  // #
  //     { wch: 30 }, // Name
  //     { wch: 25 }, // Email
  //     { wch: 15 }, // Phone
  //     { wch: 15 }, // Main Amount
  //     { wch: 15 }, // Return Amount
  //   ];
  //   worksheet['!cols'] = wscols;

  //   const workbook = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(workbook, worksheet, "Account Summary");
  //   XLSX.writeFile(workbook, `${fileName}.xlsx`);
  // },

  /**
   * Generate PDF File with Dynamic Headers
   */
  generatePDF: (data, fileName, context = {}) => {
    const doc = new jsPDF();
    const type = context.type || 'sale';
    const isSale = type === 'sale';

    // Dynamic Configuration
    const config = {
      title: isSale ? "Sales Account Summary" : "Purchase Account Summary",
      mainHeader: isSale ? "Sales" : "Purchase",
      returnHeader: isSale ? "Sales Return" : "Purchase Return",
      mainKey: isSale ? "sale" : "purchase",
      returnKey: isSale ? "salesReturn" : "purchaseReturn",
    };

    // -- HEADER --
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); // slate-800
    doc.text(config.title, 14, 15);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text("Customer & Vendor Ledger Analysis", 14, 20);

    doc.setFontSize(8);
    const dateStr = formatDate(new Date(), 'dd MMM yyyy, hh:mm a');
    doc.text(dateStr, doc.internal.pageSize.width - 14, 15, { align: 'right' });

    // -- TABLE DATA --
    const tableBody = data.map((item, index) => [
      index + 1,
      item.accountName,
      item.email || '-',
      item.phoneNo || '-',
      formatCurrency(item?.breakdown?.[config.mainKey] || 0),
      formatCurrency(item?.breakdown?.[config.returnKey] || 0),
    ]);

    // -- GENERATE TABLE --
    autoTable(doc, {
      startY: 25,
      head: [['#', 'Account Name', 'Email', 'Phone', config.mainHeader, config.returnHeader]],
      body: tableBody,
      theme: 'grid',
      styles: {
        fontSize: 9,
        textColor: [71, 85, 105], // slate-600
        lineColor: [226, 232, 240], // slate-200
        lineWidth: 0.1,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [248, 250, 252], // slate-50
        textColor: [71, 85, 105],   // slate-600
        fontStyle: 'bold',
        lineColor: [203, 213, 225], // slate-300
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { fontStyle: 'bold', textColor: [51, 65, 85] },
        4: { halign: 'right', font: 'courier' },
        5: { halign: 'right', font: 'courier', textColor: [234, 88, 12] }, // Orange-600 for Returns
      },
    });

    doc.save(`${fileName}.pdf`);
  },

  /**
   * Helper to generate consistent filenames
   */
  generateFileName: (format, startDate = null, endDate = null) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const ext = format === 'excel' ? 'xlsx' : 'pdf';
    
    let baseName = 'account-summary';
    
    if (startDate && endDate) {
      const start = new Date(startDate).toISOString().split('T')[0];
      const end = new Date(endDate).toISOString().split('T')[0];
      baseName = `${baseName}-${start}-to-${end}`;
    }
    
    return `${baseName}-${dateStr}-${timeStr}.${ext}`;
  },
};
