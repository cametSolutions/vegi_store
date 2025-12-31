// src/helper/downloadHelper/downloadHelper.js

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

// ✅ Helper function to format address (split by comma)
const formatAddress = (address) => {
  if (!address) return '';
  return address
    .split(',')
    .map(part => part.trim())
    .filter(part => part)
    .join(', ');
};

export const downloadHelper = {
  
  generateExcel: (data, fileName, context = {}) => {
    const type = context.type || 'sale';
    const isSale = type === 'sale';
    
    const mainHeader = isSale ? "Sales" : "Purchase";
    const returnHeader = isSale ? "Sales Return" : "Purchase Return";
    const mainKey = isSale ? "sale" : "purchase";
    const returnKey = isSale ? "salesReturn" : "purchaseReturn";

    const rows = data.map((item, index) => ({
      '#': index + 1,
      'Account Name': item.accountName || '-',
      'Email': item.email || '-',
      'Phone': item.phoneNo || '-',
      [mainHeader]: item.breakdown?.[mainKey] || 0,
      [returnHeader]: item.breakdown?.[returnKey] || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    const wscols = [
      { wch: 5 },
      { wch: 30 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ];
    worksheet['!cols'] = wscols;

    // ✅ Apply alignment to cells
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    for (let row = range.s.row; row <= range.e.row; row++) {
      // Col E (index 4) - Sales/Purchase - RIGHT ALIGN
      const cellE = XLSX.utils.encode_cell({ r: row, c: 4 });
      if (!worksheet[cellE]) worksheet[cellE] = {};
      worksheet[cellE].alignment = { horizontal: 'right', vertical: 'center' };

      // Col F (index 5) - Sales Return/Purchase Return - RIGHT ALIGN
      const cellF = XLSX.utils.encode_cell({ r: row, c: 5 });
      if (!worksheet[cellF]) worksheet[cellF] = {};
      worksheet[cellF].alignment = { horizontal: 'right', vertical: 'center' };
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Account Summary");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  },

  generatePDF: (data, fileName, context = {}) => {
    const doc = new jsPDF();
    const type = context.type || 'sale';
    const isSale = type === 'sale';
    const company = context.company || {};
    
    // Dates
    const startDate = context.startDate;
    const endDate = context.endDate;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 14;

    const config = {
      title: "Account Summary",
      analysisType: isSale ? "Sales Analysis" : "Purchase Analysis",
      mainHeader: isSale ? "Sales" : "Purchase",
      returnHeader: isSale ? "Sales Return" : "Purchase Return",
      mainKey: isSale ? "sale" : "purchase",
      returnKey: isSale ? "salesReturn" : "purchaseReturn",
    };

    // ✅ DRAW BACKGROUND RECTANGLE
    // x=0, y=0, width=pageWidth, height=55 (adjust based on content)
    doc.setFillColor(248, 250, 252); // Very light slate/gray (slate-50)
    doc.rect(0, 0, pageWidth, 55, 'F'); // 'F' means Fill

    let y = 20;

    // --- LEFT SIDE: REPORT TITLE & DATES ---
    
    // 1. Report Title
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); 
    doc.setFont("helvetica", "bold");
    doc.text(config.title, margin, y);
    y += 7;

    // 2. Subtitle
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); 
    doc.setFont("helvetica", "normal");
    doc.text(config.analysisType, margin, y);
    y += 8;

    // 3. Date Range
    if (startDate && endDate) {
        const startStr = formatDate(new Date(startDate), 'dd MMM yyyy');
        const endStr = formatDate(new Date(endDate), 'dd MMM yyyy');
        
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105); 
        doc.setFont("helvetica", "bold");
        doc.text("Period:", margin, y);
        
        doc.setFont("helvetica", "normal");
        doc.text(`${startStr} to ${endStr}`, margin + 12, y);
        y += 5;
    }

    // 4. Generated On
    const generatedStr = formatDate(new Date(), 'dd MMM yyyy, hh:mm a');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${generatedStr}`, margin, y);

    // --- RIGHT SIDE: COMPANY INFO (Right Aligned) ---
    let rightY = 20;
    const rightMargin = pageWidth - margin;

    // 1. Company Name
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); 
    doc.setFont("helvetica", "bold");
    doc.text(company.companyName || "Company Name", rightMargin, rightY, { align: 'right' });
    rightY += 6;

    // 2. Address
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "normal");

    if (company.permanentAddress) {
        const addressText = doc.splitTextToSize(company.permanentAddress, 80); 
        addressText.forEach(line => {
            doc.text(line, rightMargin, rightY, { align: 'right' });
            rightY += 4;
        });
    }

    rightY += 2; 

    // 3. Contact Info
    if (company.email || company.mobile) {
        const contactText = [company.email, company.mobile].filter(Boolean).join(' | ');
        doc.text(contactText, rightMargin, rightY, { align: 'right' });
        rightY += 4;
    }

    // 4. Tax IDs
    if (company.gstNumber) {
        doc.text(`GSTIN: ${company.gstNumber}`, rightMargin, rightY, { align: 'right' });
        rightY += 4;
    }

    // --- DIVIDER LINE ---
    const headerBottom = 55;
    
    doc.setDrawColor(226, 232, 240); 
    doc.setLineWidth(0.5);
    doc.line(0, headerBottom, pageWidth, headerBottom); // Full width line

    // --- TABLE ---
    const tableStartY = headerBottom + 10; // Add some padding

    const tableBody = data.map((item, index) => [
      index + 1,
      item.accountName,
      item.email || '-',
      item.phoneNo || '-',
      formatCurrency(item.breakdown?.[config.mainKey] || 0),
      formatCurrency(item.breakdown?.[config.returnKey] || 0),
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [['#', 'Account Name', 'Email', 'Phone', config.mainHeader, config.returnHeader]],
      body: tableBody,
      theme: 'grid',
      styles: {
          fontSize: 9,
          textColor: [51, 65, 85], 
          lineColor: [226, 232, 240], 
          lineWidth: 0.1,
          cellPadding: 3,
          valign: 'middle' 
      },
      headStyles: {
          fillColor: [255, 255, 255], 
          textColor: [15, 23, 42], 
          fontStyle: 'bold',
          lineColor: [203, 213, 225],
          lineWidth: 0.1,
          halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left', fontStyle: 'bold', textColor: [15, 23, 42] }, 
        2: { halign: 'left' }, 
        3: { halign: 'left' }, 
        4: { halign: 'right', font: 'courier', fontStyle: 'bold' }, 
        5: { halign: 'right', font: 'courier', textColor: [234, 88, 12] },
      },
      didParseCell: (data) => {
        if (data.section === 'head') {
          if (data.column.index === 4 || data.column.index === 5) {
            data.cell.styles.halign = 'right';
          }
        }
      }
    });

    doc.save(`${fileName}.pdf`);
  },

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
