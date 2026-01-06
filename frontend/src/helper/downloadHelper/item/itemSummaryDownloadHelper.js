// src/helper/downloadHelper/item/itemSummaryDownloadHelper.js

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format as formatDate } from 'date-fns';
// import { formatINR } from '@/shared/utils/currency';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const itemSummaryDownloadHelper = {
  
  getItems: (data) => {
    if (Array.isArray(data)) return data;
    if (data?.items && Array.isArray(data.items)) return data.items;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
  },

  generateExcel: (responseData, fileName, context = {}) => {
    const items = itemSummaryDownloadHelper.getItems(responseData);
    
    if (items.length === 0) {
      console.warn("No items to generate Excel");
      return;
    }

    const { transactionType } = context;
    const isSale = transactionType === 'sale';
    
    const mainLabel = isSale ? 'Sales' : 'Purchase';
    const returnLabel = isSale ? 'Sales Return' : 'Purchase Return';

    const rows = items.map((item, index) => ({
      '#': index + 1,
      'Item Name': item.itemName,
      'Unit': item.unit,
      // Removed Opening
      [`${mainLabel} Qty`]: Number(isSale ? (item.totalOut || 0) : (item.totalIn || 0)),
      [`${mainLabel} Amount`]: Number(isSale ? (item.amountOut || 0) : (item.amountIn || 0)),
      [`${returnLabel} Qty`]: Number(isSale ? (item.totalIn || 0) : (item.totalOut || 0)),
      [`${returnLabel} Amount`]: Number(isSale ? (item.amountIn || 0) : (item.amountOut || 0)),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Item Summary");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  },

  generatePDF: (responseData, fileName, context = {}) => {
    const items = itemSummaryDownloadHelper.getItems(responseData);
    
    if (!items || items.length === 0) {
      console.warn("No items to generate PDF");
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const { transactionType, startDate, endDate, company = {} } = context;
    const isSale = transactionType === 'sale';
    
    // Page Dimensions
    const pageWidth = doc.internal.pageSize.width;
    const margin = 10;
    
    const config = {
      title: "Item Summary Report",
      analysisType: isSale ? "Sales Analysis" : "Purchase Analysis",
      mainHeader: isSale ? "Sales" : "Purchase",
      returnHeader: isSale ? "Sales Return" : "Purchase Return",
      themeColor :[16, 185, 129] 
    };

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
    doc.text(config.analysisType, margin, y);
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
    
    // REDISTRIBUTED WIDTHS (Total ~100%)
    // Removed Opening (12%) -> Added +10% to Item Name, +1% to Unit, +1% to Amt
    const colWidths = {
      0: usableWidth * 0.05, // # (5%)
      1: usableWidth * 0.35, // Item Name (35%) - WIDER
      2: usableWidth * 0.09, // Unit (9%) - Slightly wider
      // Removed Opening
      3: usableWidth * 0.12, // Main Qty (12%)
      4: usableWidth * 0.13, // Main Amt (13%)
      5: usableWidth * 0.12, // Ret Qty (12%)
      6: usableWidth * 0.14, // Ret Amt (14%) - Wider for totals
    };

    const truncateText = (text, maxLength = 25) => { // Increased limit
      if (!text) return '-';
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    const tableBody = items.map((item, index) => {
      const mainQty = isSale ? (item.totalOut || 0) : (item.totalIn || 0);
      const mainAmt = isSale ? (item.amountOut || 0) : (item.amountIn || 0);
      const retQty = isSale ? (item.totalIn || 0) : (item.totalOut || 0);
      const retAmt = isSale ? (item.amountIn || 0) : (item.amountOut || 0);

      return [
        index + 1,
        truncateText(item.itemName, 25),
        item.unit,
        // Removed Opening
        mainQty.toLocaleString(),
        formatCurrency(mainAmt),
        retQty.toLocaleString(),
        formatCurrency(retAmt),
      ];
    });

    const totalMainAmt = items.reduce((sum, item) => 
      sum + (isSale ? (item.amountOut || 0) : (item.amountIn || 0)), 0
    );
    const totalRetAmt = items.reduce((sum, item) => 
      sum + (isSale ? (item.amountIn || 0) : (item.amountOut || 0)), 0
    );

    tableBody.push([
      '', 'TOTAL', '',
      '', formatCurrency(totalMainAmt),
      '', formatCurrency(totalRetAmt)
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [[
        '#',
        'Item Name',
        'Unit', // Fixed: Single line
        // Removed Opening
        `${config.mainHeader}\nQty`,
        `${config.mainHeader}\nAmount`,
        `${config.returnHeader}\nQty`,
        `${config.returnHeader}\nAmount`,
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
        fillColor: config.themeColor,
        textColor: 255,
        fontStyle: 'bold',
        lineColor: config.themeColor,
        lineWidth: 0.1,
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: colWidths[0] }, // #
        1: { halign: 'left', fontStyle: 'bold', cellWidth: colWidths[1] }, // Item Name
        2: { halign: 'center', cellWidth: colWidths[2] }, // Unit
        // New Indices
        3: { halign: 'right', cellWidth: colWidths[3] }, // Main Qty
        4: { halign: 'right', fontStyle: 'bold', cellWidth: colWidths[4] }, // Main Amt
        5: { halign: 'right', cellWidth: colWidths[5] }, // Ret Qty
        6: { halign: 'right', fontStyle: 'bold', textColor: [234, 88, 12], cellWidth: colWidths[6] }, // Ret Amt
      },
      didParseCell: (data) => {
        if (data.row.index === tableBody.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 240, 240];
          data.cell.styles.textColor = [15, 23, 42];
        }
      },
      didDrawPage: (data) => {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `Page ${doc.internal.getNumberOfPages()}`,
          pageWidth - margin - 10,
          doc.internal.pageSize.getHeight() - 8
        );
      }
    });

    doc.save(`${fileName}.pdf`);
  }
};
