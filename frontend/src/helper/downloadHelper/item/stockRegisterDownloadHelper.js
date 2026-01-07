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

export const stockRegisterDownloadHelper = {
  getItems: (data) => {
    if (Array.isArray(data)) return data;
    if (data?.items && Array.isArray(data.items)) return data.items;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
  },

  generateExcel: (responseData, fileName, context = {}) => {
    const items = stockRegisterDownloadHelper.getItems(responseData);
    const rows = items.map((item, index) => ({
      '#': index + 1,
      'Item Name': item.itemName,
      'Unit': item.unit,
      'Opening Qty': item.openingQuantity || 0,
      'Inward Qty': item.totalIn || 0,
      'Outward Qty': item.totalOut || 0,
      'Closing Qty': item.closingQuantity || 0,
      'Closing Rate': item.lastPurchaseRate || 0,
      'Closing Amount': item.closingBalance || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Register");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  },

  generatePDF: (responseData, fileName, context = {}) => {
    const items = stockRegisterDownloadHelper.getItems(responseData);
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const { startDate, endDate, company = {} } = context;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 10;

    // --- Header ---
    const headerHeight = 45;
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');

    doc.setFontSize(14);
    // doc.setTextColor(79, 70, 229); // Indigo color for Stock Register
    doc.setFont("helvetica", "bold");
    doc.text("Stock Register Report", margin, 15);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text(`Period: ${formatDate(new Date(startDate), 'dd MMM yyyy')} to ${formatDate(new Date(endDate), 'dd MMM yyyy')}`, margin, 22);

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
    rightY += 4;

    // --- Table ---
    const tableBody = items.map((item, index) => [
      index + 1,
      item.itemName,
      item.unit,
      (item.openingQuantity || 0).toLocaleString(),
      (item.totalIn || 0).toLocaleString(),
      (item.totalOut || 0).toLocaleString(),
      (item.closingQuantity || 0).toLocaleString(),
      formatCurrency(item.lastPurchaseRate || 0),
      formatCurrency(item.closingBalance || 0),
    ]);

    autoTable(doc, {
      startY: headerHeight + 5,
      head: [['#', 'Item Name', 'Unit', 'Opening', 'Inward', 'Outward', 'Closing Qty', 'Rate', 'Amount']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], halign: 'center' },
      styles: { fontSize: 8 },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right', fontStyle: 'bold' },
        7: { halign: 'right' },
        8: { halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: margin, right: margin }
    });

    doc.save(`${fileName}.pdf`);
  }
};
