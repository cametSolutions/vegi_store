// src/helper/downloadHelper/transaction/transactionSummaryDownloadHelper.js

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format as formatDate } from 'date-fns';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const transactionSummaryDownloadHelper = {
  
  getTransactions: (data) => {
    if (Array.isArray(data)) return data;
    if (data?.transactions && Array.isArray(data.transactions)) return data.transactions;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
  },

  generateExcel: (responseData, fileName, context = {}) => {
    const transactions = transactionSummaryDownloadHelper.getTransactions(responseData);
    
    if (transactions.length === 0) {
      console.warn("No transactions to generate Excel");
      return;
    }

    const { transactionType } = context;
    
    const rows = transactions.map((txn, index) => ({
      '#': index + 1,
      'Ref No.': txn.transactionNumber || '-',
      'Date': txn.transactionDate ? formatDate(new Date(txn.transactionDate), 'dd MMM yyyy') : '-',
      'Account Name': txn.accountName || '-',
      'Phone': txn.phone || '-',
      'Email': txn.email || '-',
      'Net Amount': Number(txn.netAmount || 0),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transaction Summary");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  },

  generatePDF: (responseData, fileName, context = {}) => {
    const transactions = transactionSummaryDownloadHelper.getTransactions(responseData);
    
    if (!transactions || transactions.length === 0) {
      console.warn("No transactions to generate PDF");
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const { transactionType, startDate, endDate, company = {} } = context;
    
    // Page Dimensions
    const pageWidth = doc.internal.pageSize.width;
    const margin = 10;
    
    // Configuration based on transaction type
    const TRANSACTION_CONFIG = {
      sale: { title: "Sales Summary Report", color: [16, 185, 129] },
      purchase: { title: "Purchase Summary Report", color: [59, 130, 246] },
      sales_return: { title: "Sales Return Report", color: [249, 115, 22] },
      purchase_return: { title: "Purchase Return Report", color: [168, 85, 247] },
    };
    
    const config = TRANSACTION_CONFIG[transactionType] || TRANSACTION_CONFIG.sale;

    // --- HEADER SECTION ---
    const headerHeight = 45;
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');

    let y = 10;

    // Report Title
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.text(config.title, margin, y);
    y += 5;

    // Subtitle
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text("Transaction Analysis", margin, y);
    y += 5;

    // Date Range
    if (startDate && endDate) {
      const startStr = formatDate(new Date(startDate), 'dd MMM yyyy');
      const endStr = formatDate(new Date(endDate), 'dd MMM yyyy');
      
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.setFont("helvetica", "bold");
      doc.text("Period:", margin, y);
      
      doc.setFont("helvetica", "normal");
      doc.text(`${startStr} to ${endStr}`, margin + 10, y);
      y += 4;
    }

    // Generated On
    const generatedStr = formatDate(new Date(), 'dd MMM yyyy, hh:mm a');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${generatedStr}`, margin, y);

    // --- COMPANY INFO ---
    let rightY = 10;
    const rightMargin = pageWidth - margin;

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(company.companyName || "Company Name", rightMargin, rightY, { align: 'right' });
    rightY += 5;

    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "normal");

    if (company.permanentAddress) {
      const addressText = doc.splitTextToSize(company.permanentAddress, 80);
      addressText.slice(0, 2).forEach(line => {
        doc.text(line, rightMargin, rightY, { align: 'right' });
        rightY += 4;
      });
    }

    if (company.email || company.mobile) {
      const contactText = [company.email, company.mobile].filter(Boolean).join(' | ');
      doc.text(contactText, rightMargin, rightY, { align: 'right' });
      rightY += 4;
    }

    if (company.gstNumber) {
      doc.text(`GSTIN: ${company.gstNumber}`, rightMargin, rightY, { align: 'right' });
    }

    // --- DIVIDER LINE ---
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(0, headerHeight + 2, pageWidth, headerHeight + 2);

    // --- TABLE CONFIGURATION ---
    const tableStartY = headerHeight + 7;
    const usableWidth = pageWidth - (margin * 2);
    
    // Column widths
    const colWidths = {
      0: usableWidth * 0.05,  // #
      1: usableWidth * 0.12,  // Ref No
      2: usableWidth * 0.10,  // Date
      3: usableWidth * 0.25,  // Account Name
      4: usableWidth * 0.15,  // Phone
      5: usableWidth * 0.20,  // Email
      6: usableWidth * 0.13,  // Net Amount
    };

    const truncateText = (text, maxLength = 30) => {
      if (!text) return '-';
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    const tableBody = transactions.map((txn, index) => {
      return [
        index + 1,
        truncateText(txn.transactionNumber, 20),
        txn.transactionDate ? formatDate(new Date(txn.transactionDate), 'dd MMM yyyy') : '-',
        truncateText(txn.accountName, 30),
        txn.phone || '-',
        truncateText(txn.email, 25),
        formatCurrency(txn.netAmount || 0),
      ];
    });

    // Calculate total
    const totalAmount = transactions.reduce((sum, txn) => sum + (txn.netAmount || 0), 0);

    // Add total row
    tableBody.push([
      '', '', 'TOTAL', '', '', '',
      formatCurrency(totalAmount)
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [[
        '#',
        'Ref No.',
        'Date',
        'Account Name',
        'Phone',
        'Email',
        'Net Amount',
      ]],
      body: tableBody,
      theme: 'grid',
      tableWidth: 'auto',
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9,
        textColor: [51, 65, 85],
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
        cellPadding: 3,
        valign: 'middle',
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: config.color,
        textColor: 255,
        fontStyle: 'bold',
        lineColor: config.color,
        lineWidth: 0.1,
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: colWidths[0] },
        1: { halign: 'left', cellWidth: colWidths[1] },
        2: { halign: 'left', cellWidth: colWidths[2] },
        3: { halign: 'left', fontStyle: 'bold', cellWidth: colWidths[3] },
        4: { halign: 'left', cellWidth: colWidths[4] },
        5: { halign: 'left', cellWidth: colWidths[5] },
        6: { halign: 'right', fontStyle: 'bold', cellWidth: colWidths[6] },
      },
      didParseCell: (data) => {
        if (data.row.index === tableBody.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 240, 240];
          data.cell.styles.textColor = [15, 23, 42];
        }
      },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Page ${doc.internal.getCurrentPageInfo().pageNumber}`,
          pageWidth - margin - 10,
          doc.internal.pageSize.getHeight() - 8
        );
      }
    });

    doc.save(`${fileName}.pdf`);
  }
};
