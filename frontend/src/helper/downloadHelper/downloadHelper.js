import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const downloadHelper = {
  generatePDF: (data, fileName) => {
    const doc = new jsPDF('l', 'mm', 'a4');

    // Header
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('Account Summary Report', 14, 15);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, 22);
    doc.text(`Total Accounts: ${data.length}`, 14, 27);

    // Calculate totals
    const totals = data.reduce((acc, account) => ({
      openingBalance: acc.openingBalance + (account.openingBalance || 0),
      totalDebit: acc.totalDebit + (account.totalDebit || 0),
      totalCredit: acc.totalCredit + (account.totalCredit || 0),
      closingBalance: acc.closingBalance + (account.closingBalance || 0),
      transactionCount: acc.transactionCount + (account.transactionCount || 0),
    }), { openingBalance: 0, totalDebit: 0, totalCredit: 0, closingBalance: 0, transactionCount: 0 });

    // Table data
    const tableData = data.map(account => [
      account.accountName,
      account.email || '-',
      account.phoneNo || '-',
      account.openingBalance.toFixed(2),
      account.totalDebit.toFixed(2),
      account.totalCredit.toFixed(2),
      account.closingBalance.toFixed(2),
      account.transactionCount.toString(),
    ]);

    // Add totals row
    tableData.push([
      'TOTAL',
      '',
      '',
      totals.openingBalance.toFixed(2),
      totals.totalDebit.toFixed(2),
      totals.totalCredit.toFixed(2),
      totals.closingBalance.toFixed(2),
      totals.transactionCount.toString(),
    ]);

    // Generate table - CHANGE: Pass doc as first parameter
    autoTable(doc, {
      startY: 32,
      head: [['Account Name', 'Email', 'Phone', 'Opening', 'Debit', 'Credit', 'Closing', 'Txns']],
      body: tableData,
      theme: 'grid',
      styles: { 
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
        halign: 'left',
      },
      headStyles: { 
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 45 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 25, halign: 'right' },
        7: { cellWidth: 20, halign: 'center' },
      },
      didParseCell: (data) => {
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fillColor = [243, 244, 246];
          data.cell.styles.fontStyle = 'bold';
        }
      },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.text(
          `Page ${doc.internal.getCurrentPageInfo().pageNumber}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      },
    });

    // Save PDF
    doc.save(fileName);
  },

  /**
   * Generate filename with date and time
   * @param {string} format - 'excel' or 'pdf'
   * @param {Date} startDate - Report start date (optional)
   * @param {Date} endDate - Report end date (optional)
   * @returns {string} - Generated filename
   */
  generateFileName: (format, startDate = null, endDate = null) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // 2025-12-30
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // 16-51-30
    const ext = format === 'excel' ? 'xlsx' : 'pdf';
    
    let baseName = 'account-summary';
    
    // If date range provided, include in filename
    if (startDate && endDate) {
      const start = new Date(startDate).toISOString().split('T')[0];
      const end = new Date(endDate).toISOString().split('T')[0];
      baseName = `${baseName}-${start}-to-${end}`;
    }
    
    return `${baseName}-${dateStr}-${timeStr}.${ext}`;
  },
};
