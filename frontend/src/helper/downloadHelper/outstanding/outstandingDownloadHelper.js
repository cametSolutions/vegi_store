// src/helper/downloadHelper/outstanding/outstandingDownloadHelper.js

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format as formatDate } from 'date-fns';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
};

const getTransactionLabel = (type) => {
  const labels = {
    sale: "Sale",
    purchase: "Purchase",
    sales_return: "Sales Ret",
    purchase_return: "Purch Ret",
    opening_balance: "Opening",
    advance_receipt: "Adv. Rect",
    advance_payment: "Adv. Pay",
  };
  return labels[type] || type?.replace("_", " ") || "-";
};

export const outstandingDownloadHelper = {
  
  getTransactions: (data) => {
    if (Array.isArray(data)) return data;
    if (data?.transactions && Array.isArray(data.transactions)) return data.transactions;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
  },

  getOutstandingType: (responseData) => {
    const totalDr = Number(responseData.totalDr || 0);
    const totalCr = Number(responseData.totalCr || 0);
    if (!totalDr && !totalCr && responseData.totalOutstanding) {
        return responseData.totalOutstanding >= 0 ? 'DR' : 'CR';
    }
    return totalDr >= totalCr ? 'DR' : 'CR';
  },

  generateExcel: (responseData, fileName, context = {}) => {
    // ... (Excel generation code remains the same) ...
    const transactions = outstandingDownloadHelper.getTransactions(responseData);
    if (transactions.length === 0) return;

    const rows = transactions.map((txn, index) => ({
      '#': index + 1,
      'Type': getTransactionLabel(txn.transactionType),
      'Ref No': txn.transactionNumber || '-',
      'Date': txn.transactionDate ? formatDate(new Date(txn.transactionDate), 'dd MMM yyyy') : '-',
      'Total Amount': Number(txn.totalAmount || 0),
      'Paid Amount': Number(txn.paidAmount || 0),
      'Balance': Number(txn.closingBalanceAmount || 0),
      'Dr/Cr': txn.outstandingType === 'dr' ? 'DR' : 'CR'
    }));

    const totalOutstanding = Number(responseData.totalOutstanding || 0);
    const outstandingType = outstandingDownloadHelper.getOutstandingType(responseData);
    
    rows.push({
      '#': '', 'Type': '', 'Ref No': '', 'Date': '', 'Total Amount': '',
      'Paid Amount': 'TOTAL OUTSTANDING:',
      'Balance': totalOutstanding,
      'Dr/Cr': outstandingType
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Outstanding Statement");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  },

  generatePDF: (responseData, fileName, context = {}) => {
    const transactions = outstandingDownloadHelper.getTransactions(responseData);
    
    if (!transactions || transactions.length === 0) {
      console.warn("No transactions to generate PDF");
      return;
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const { startDate, endDate, company = {}, partyName } = context;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 10; // Left and Right Margin
    
    const config = {
      title: "Statement of Accounts",
      themeColor: [15, 118, 110] 
    };

    // --- HEADER SECTION ---
    const headerHeight = 45;
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');

    let y = 10;
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.text(config.title, margin, y);
    y += 5;

    doc.setFontSize(11);
    doc.setTextColor(15, 118, 110);
    doc.text(partyName || "Party Ledger", margin, y);
    y += 5;

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

    const generatedStr = formatDate(new Date(), 'dd MMM yyyy, hh:mm a');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${generatedStr}`, margin, y);

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

    // --- TABLE CONFIGURATION ---
    const tableStartY = headerHeight + 7;
    
    const tableBody = transactions.map((txn, index) => {
      return [
        index + 1,
        getTransactionLabel(txn.transactionType),
        txn.transactionNumber || '-',
        txn.transactionDate ? formatDate(new Date(txn.transactionDate), 'dd MMM yyyy') : '-',
        formatCurrency(txn.totalAmount || 0),
        formatCurrency(txn.paidAmount || 0),
        { 
          content: `${formatCurrency(txn.closingBalanceAmount)} ${txn.outstandingType === 'dr' ? 'DR' : 'CR'}`,
          styles: { 
            textColor: txn.outstandingType === 'dr' ? [13, 148, 136] : [225, 29, 72],
            fontStyle: 'bold'
          }
        }
      ];
    });

    const totalOutstanding = Number(responseData.totalOutstanding || 0);
    const outstandingType = outstandingDownloadHelper.getOutstandingType(responseData);
    const isDr = outstandingType === 'DR';

    tableBody.push([
      { content: 'TOTAL OUTSTANDING', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold' } },
      { 
        content: `${formatCurrency(totalOutstanding)} ${outstandingType}`,
        styles: { 
          fontStyle: 'bold', 
          fillColor: [240, 253, 250],
          textColor: isDr ? [13, 148, 136] : [225, 29, 72]
        }
      }
    ]);

    autoTable(doc, {
      startY: tableStartY,
      // ✅ Set margin to ensure full width usage
      margin: { left: margin, right: margin },
      head: [[
        '#', 'Type', 'Ref No.', 'Date', 'Total', 'Paid', 'Balance',
      ]],
      body: tableBody,
      theme: 'grid',
      headStyles: {
        fillColor: config.themeColor,
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
      },
      // ✅ Removed fixed widths so columns auto-expand to fill page
      columnStyles: {
        0: { halign: 'center' }, // #
        1: { halign: 'center' }, // Type
        2: { halign: 'left' },   // Ref No
        3: { halign: 'left' },   // Date
        4: { halign: 'right' },  // Total
        5: { halign: 'right' },  // Paid
        6: { halign: 'right' },  // Balance
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        overflow: 'linebreak',
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
