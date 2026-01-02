import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format as formatDate } from "date-fns";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// ✅ Helper function for transaction labels
const getTransactionLabel = (type) => {
  const labels = {
    sale: "BY SALES",
    receipt: "BY RECEIPT",
    purchase: "BY PURCHASE",
    payment: "BY PAYMENT",
    sales_return: "BY SALES RETURN",
    purchase_return: "BY PURCHASE RETURN",
    sales_payment: "BY SALES PAYMENT",
    purchase_receipt: "BY PURCHASE RECEIPT",
  };
  return labels[type?.toLowerCase()] || type?.toUpperCase() || "TRANSACTION";
};

export const statementDownloadHelper = {
  // ✅ EXCEL FOR ACCOUNT STATEMENT
  generateExcel: (data, fileName, context = {}) => {
    const accountData = data[0];

    if (!accountData) {
      console.error("No account data provided");
      return;
    }

    const {
      accountName,
      partyName,
      email,
      phoneNo,
      openingBalance,
      transactions = [],
      summary = {},
    } = accountData;

    const startDate = context.startDate;
    const endDate = context.endDate;

    // ✅ Use summary data if available
    const totalDebit = summary.totalDebit || accountData.totalDebit || 0;
    const totalCredit = summary.totalCredit || accountData.totalCredit || 0;
    const closingBalance = summary.closingBalance || accountData.closingBalance || 0;

    const rows = [];

    // ========== HEADER SECTION ==========
    rows.push({
      DATE: accountName || partyName || "Account Statement",
      NARRATION: email || "-",
      DR: phoneNo || "-",
      CR: `${formatDate(new Date(startDate), "dd-MMM-yyyy")} to ${formatDate(new Date(endDate), "dd-MMM-yyyy")}`,
    });

    // Empty spacing
    rows.push({});

    // Column Headers
    rows.push({
      DATE: "DATE",
      NARRATION: "NARRATION",
      DR: "DR",
      CR: "CR",
    });

    // Empty spacing
    rows.push({});

    // ========== OPENING BALANCE ==========
    rows.push({
      DATE: "Opening Balance",
      NARRATION: `(as on ${formatDate(new Date(startDate), "dd-MMM-yyyy")})`,
      DR: openingBalance > 0 ? formatCurrency(Math.abs(openingBalance)) : "",
      CR: openingBalance < 0 ? formatCurrency(Math.abs(openingBalance)) : "",
    });

    // Empty spacing
    rows.push({});

    // ========== TRANSACTIONS ==========
    const groupedByDate = {};
    transactions.forEach((txn) => {
      const dateKey = formatDate(new Date(txn.transactionDate), "yyyy-MM-dd");
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push(txn);
    });

    // Sort dates
    const sortedDates = Object.keys(groupedByDate).sort();

    sortedDates.forEach((dateKey) => {
      const txns = groupedByDate[dateKey];
      const dateObj = new Date(txns[0].transactionDate);
      const formattedDate = formatDate(dateObj, "dd-MMM-yyyy");

      let dailyDebit = 0;
      let dailyCredit = 0;

      txns.forEach((txn, idx) => {
        const amount = Math.abs(txn.effectiveAmount || txn.amount || 0);
        const type = txn.transactionType?.toLowerCase();

        const drTypes = ["sale", "purchase_return", "payment", "sales_payment"];
        const crTypes = ["purchase", "sales_return", "receipt", "purchase_receipt"];

        const isDebit = drTypes.includes(type) || txn.ledgerSide === "debit";
        const isCredit = crTypes.includes(type) || txn.ledgerSide === "credit";

        if (isDebit) dailyDebit += amount;
        if (isCredit) dailyCredit += amount;

        rows.push({
          DATE: idx === 0 ? formattedDate : "",
          NARRATION: `${getTransactionLabel(txn.transactionType)} ${txn.transactionNumber ? `(${txn.transactionNumber})` : ""}`,
          DR: isDebit ? formatCurrency(amount) : "",
          CR: isCredit ? formatCurrency(amount) : "",
        });
      });

      // Daily total
      rows.push({
        DATE: "",
        NARRATION: `TOTAL FOR ${formattedDate.toUpperCase()}`,
        DR: formatCurrency(dailyDebit),
        CR: formatCurrency(dailyCredit),
      });

      // Empty spacing between dates
      rows.push({});
    });

    // ========== GRAND TOTALS ==========
    rows.push({
      DATE: "",
      NARRATION: "TOTAL AMOUNT",
      DR: formatCurrency(totalDebit),
      CR: formatCurrency(totalCredit),
    });

    rows.push({
      DATE: "",
      NARRATION: "TOTAL CLOSING BALANCE",
      DR: closingBalance > 0 ? formatCurrency(Math.abs(closingBalance)) : "",
      CR: closingBalance < 0 ? formatCurrency(Math.abs(closingBalance)) : "",
    });

    // ========== CREATE WORKSHEET ==========
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // ========== COLUMN WIDTHS ==========
    worksheet["!cols"] = [
      { wch: 16 },  // DATE
      { wch: 65 },  // NARRATION (wider for better readability)
      { wch: 18 },  // DR
      { wch: 18 },  // CR
    ];

    // ========== ROW HEIGHTS ==========
    const wsrows = [];
    rows.forEach((row, idx) => {
      const narrationValue = row.NARRATION || "";

      if (idx === 0) {
        // Header row with account info
        wsrows[idx] = { hpt: 26, hidden: false };
      } else if (idx === 2) {
        // Column header row
        wsrows[idx] = { hpt: 24, hidden: false };
      } else if (narrationValue.includes("Opening Balance")) {
        wsrows[idx] = { hpt: 22, hidden: false };
      } else if (Object.values(row).every(v => !v || v === "")) {
        // Empty spacer rows
        wsrows[idx] = { hpt: 10, hidden: false };
      } else if (narrationValue.includes("TOTAL")) {
        // Total rows
        wsrows[idx] = { hpt: 20, hidden: false };
      } else {
        // Regular data rows
        wsrows[idx] = { hpt: 18, hidden: false };
      }
    });
    worksheet["!rows"] = wsrows;

    // ========== CELL FORMATTING & BORDERS ==========
    const range = XLSX.utils.decode_range(worksheet["!ref"]);

    const BORDER_COLOR = "D1D5DB"; // Slate-300
    const BORDER_STYLE = {
      style: "thin",
      color: { rgb: BORDER_COLOR },
    };

    const BORDER = {
      top: BORDER_STYLE,
      bottom: BORDER_STYLE,
      left: BORDER_STYLE,
      right: BORDER_STYLE,
    };

    for (let row = range.s.row; row <= range.e.row; row++) {
      // Column A (DATE)
      const cellA = XLSX.utils.encode_cell({ r: row, c: 0 });
      if (!worksheet[cellA]) worksheet[cellA] = { t: "s", v: "" };
      worksheet[cellA].alignment = {
        horizontal: "left",
        vertical: "center",
        wrapText: false,
      };
      worksheet[cellA].border = BORDER;

      // Column B (NARRATION)
      const cellB = XLSX.utils.encode_cell({ r: row, c: 1 });
      if (!worksheet[cellB]) worksheet[cellB] = { t: "s", v: "" };
      worksheet[cellB].alignment = {
        horizontal: "left",
        vertical: "center",
        wrapText: true,
      };
      worksheet[cellB].border = BORDER;

      // Column C (DR)
      const cellC = XLSX.utils.encode_cell({ r: row, c: 2 });
      if (!worksheet[cellC]) worksheet[cellC] = { t: "s", v: "" };
      worksheet[cellC].alignment = {
        horizontal: "right",
        vertical: "center",
        wrapText: false,
      };
      worksheet[cellC].border = BORDER;

      // Column D (CR)
      const cellD = XLSX.utils.encode_cell({ r: row, c: 3 });
      if (!worksheet[cellD]) worksheet[cellD] = { t: "s", v: "" };
      worksheet[cellD].alignment = {
        horizontal: "right",
        vertical: "center",
        wrapText: false,
      };
      worksheet[cellD].border = BORDER;
    }

    // ========== STYLE HEADER ROW (Account info) ==========
    ["A", "B", "C", "D"].forEach((col) => {
      const cell = `${col}1`;
      if (worksheet[cell]) {
        worksheet[cell].font = {
          bold: true,
          size: 12,
          color: { rgb: "1F2937" }, // Slate-800
        };
        worksheet[cell].fill = { fgColor: { rgb: "F3F4F6" } }; // Slate-100
      }
    });

    // ========== STYLE COLUMN HEADERS ==========
    ["A", "B", "C", "D"].forEach((col) => {
      const cell = `${col}3`;
      if (worksheet[cell]) {
        worksheet[cell].font = {
          bold: true,
          size: 11,
          color: { rgb: "475569" }, // Slate-600
        };
        worksheet[cell].fill = { fgColor: { rgb: "F9FAFB" } }; // Slate-50
      }
    });

    // ========== STYLE OPENING BALANCE ROW ==========
    rows.forEach((row, idx) => {
      if (row.DATE === "Opening Balance") {
        ["A", "B", "C", "D"].forEach((col) => {
          const cell = XLSX.utils.encode_cell({ r: idx, c: col.charCodeAt(0) - 65 });
          if (worksheet[cell]) {
            worksheet[cell].font = {
              bold: true,
              size: 11,
              color: { rgb: "1F2937" },
            };
            worksheet[cell].fill = { fgColor: { rgb: "EDE9FE" } }; // Indigo-100
          }
        });
      }
    });

    // ========== STYLE TOTAL ROWS ==========
    for (let row = range.s.row; row <= range.e.row; row++) {
      const cellB = XLSX.utils.encode_cell({ r: row, c: 1 });
      if (worksheet[cellB] && typeof worksheet[cellB].v === "string") {
        const narration = worksheet[cellB].v;

        // Daily totals
        if (narration.includes("TOTAL FOR")) {
          ["A", "B", "C", "D"].forEach((col) => {
            const cell = XLSX.utils.encode_cell({ r: row, c: col.charCodeAt(0) - 65 });
            if (worksheet[cell]) {
              worksheet[cell].font = {
                bold: true,
                size: 10,
                color: { rgb: "4B5563" }, // Slate-600
              };
              worksheet[cell].fill = { fgColor: { rgb: "F3F4F6" } }; // Slate-100
            }
          });
        }

        // Grand totals
        if (narration === "TOTAL AMOUNT") {
          ["A", "B", "C", "D"].forEach((col) => {
            const cell = XLSX.utils.encode_cell({ r: row, c: col.charCodeAt(0) - 65 });
            if (worksheet[cell]) {
              worksheet[cell].font = {
                bold: true,
                size: 11,
                color: { rgb: "1F2937" },
              };
              worksheet[cell].fill = { fgColor: { rgb: "F9FAFB" } }; // Slate-50
            }
          });
        }

        // Closing balance
        if (narration === "TOTAL CLOSING BALANCE") {
          ["A", "B", "C", "D"].forEach((col) => {
            const cell = XLSX.utils.encode_cell({ r: row, c: col.charCodeAt(0) - 65 });
            if (worksheet[cell]) {
              worksheet[cell].font = {
                bold: true,
                size: 12,
                color: { rgb: "4F46E5" }, // Indigo-600
              };
              worksheet[cell].fill = { fgColor: { rgb: "EDE9FE" } }; // Indigo-100
            }
          });
        }
      }
    }

    // ========== FREEZE PANES ==========
    worksheet["!freeze"] = { xSplit: 0, ySplit: 3 };

    // ========== CREATE WORKBOOK ==========
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Account Statement");
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  },

  // ✅ PDF FOR ACCOUNT STATEMENT
  generatePDF: (data, fileName, context = {}) => {
    const accountData = data[0];

    if (!accountData) {
      console.error("No account data provided");
      return;
    }

    const {
      accountName,
      partyName,
      openingBalance,
      transactions = [],
      summary = {},
    } = accountData;

    const startDate = context.startDate;
    const endDate = context.endDate;
    const company = context.company || {};

    const totalDebit = summary.totalDebit || accountData.totalDebit || 0;
    const totalCredit = summary.totalCredit || accountData.totalCredit || 0;
    const closingBalance = summary.closingBalance || accountData.closingBalance || 0;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize?.getWidth?.() ?? doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize?.getHeight?.() ?? doc.internal.pageSize.height;

    const margin = 7;

    // ===== COMPACT HEADER =====
    doc.setFillColor(248, 250, 252);
    doc.rect(0, 0, pageWidth, 35, "F");

    let y = 10;

    // Left: Account name
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.text(accountName || partyName || "Account Statement", margin, y);
    y += 5;

    // Subtitle
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text("Account Statement", margin, y);
    y += 4.5;

    // Period
    if (startDate && endDate) {
      const startStr = formatDate(new Date(startDate), "dd-MMM-yyyy");
      const endStr = formatDate(new Date(endDate), "dd-MMM-yyyy");
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`Period: ${startStr} to ${endStr}`, margin, y);
    }

    // Right: Company info
    const rightX = pageWidth - margin;
    let rightY = 10;

    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text(company.companyName || "Company", rightX, rightY, { align: "right" });
    rightY += 4;

    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "normal");

    if (company.permanentAddress) {
      const addressLines = doc.splitTextToSize(company.permanentAddress, 70);
      addressLines.slice(0, 2).forEach((line) => {
        doc.text(line, rightX, rightY, { align: "right" });
        rightY += 4;
      });
    }

    if (company.email || company.mobile) {
      const contact = [company.email, company.mobile].filter(Boolean).join(" | ");
      doc.text(contact, rightX, rightY, { align: "right" });
      rightY += 4;
    }

    if (company.gstNumber) {
      doc.text(`GSTIN: ${company.gstNumber}`, rightX, rightY, { align: "right" });
      rightY += 4;
    }

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(0, 37, pageWidth, 37);

    // ===== Build table data =====
    const tableData = [];

    tableData.push([
      "Opening Balance",
      `(as on ${formatDate(new Date(startDate), "dd-MMM-yyyy")})`,
      openingBalance > 0 ? formatCurrency(Math.abs(openingBalance)) : "",
      openingBalance < 0 ? formatCurrency(Math.abs(openingBalance)) : "",
    ]);

    const groupedByDate = {};
    transactions.forEach((txn) => {
      const dateKey = formatDate(new Date(txn.transactionDate), "yyyy-MM-dd");
      if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
      groupedByDate[dateKey].push(txn);
    });

    Object.entries(groupedByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([_, txns]) => {
        const dateObj = new Date(txns[0].transactionDate);
        let dailyDr = 0;
        let dailyCr = 0;

        txns.forEach((txn, idx) => {
          const amount = Math.abs(txn.effectiveAmount || txn.amount || 0);
          const type = txn.transactionType?.toLowerCase();

          const drTypes = ["sale", "purchase_return", "payment", "sales_payment"];
          const crTypes = ["purchase", "sales_return", "receipt", "purchase_receipt"];

          const isDebit = drTypes.includes(type) || txn.ledgerSide === "debit";
          const isCredit = crTypes.includes(type) || txn.ledgerSide === "credit";

          if (isDebit) dailyDr += amount;
          if (isCredit) dailyCr += amount;

          const narration = `${getTransactionLabel(txn.transactionType)} ${
            txn.transactionNumber ? `(${txn.transactionNumber})` : ""
          }`;

          tableData.push([
            idx === 0 ? formatDate(dateObj, "dd-MMM-yyyy") : "",
            narration,
            isDebit ? formatCurrency(amount) : "",
            isCredit ? formatCurrency(amount) : "",
          ]);
        });

        tableData.push([
          "",
          `TOTAL FOR ${formatDate(dateObj, "dd-MMM-yyyy").toUpperCase()}`,
          formatCurrency(dailyDr),
          formatCurrency(dailyCr),
        ]);
      });

    // ===== Draw table =====
    autoTable(doc, {
      startY: 42,
      head: [["DATE", "NARRATION", "DR", "CR"]],
      body: tableData,
      theme: "grid",
      styles: {
        fontSize: 9,
        textColor: [51, 65, 85],
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
        cellPadding: 3,
        valign: "middle",
      },
      headStyles: {
        fillColor: [248, 250, 252],
        textColor: [71, 85, 105],
        fontStyle: "bold",
        lineColor: [203, 213, 225],
        fontSize: 9,
        halign: "left",
      },
      columnStyles: {
        0: { halign: "left", cellWidth: 25 },
        1: { halign: "left", cellWidth: 80 },
        2: { halign: "right", font: "courier", fontStyle: "bold" },
        3: { halign: "right", font: "courier", fontStyle: "bold" },
      },
      didParseCell: (d) => {
        if (d.row.index === 0 && d.section === "body") {
          d.cell.styles.fillColor = [238, 242, 255];
          d.cell.styles.fontStyle = "bold";
        }
        if (d.row.index > 0 && typeof d.row.raw?.[1] === "string" && d.row.raw[1].includes("TOTAL FOR")) {
          d.cell.styles.fillColor = [248, 250, 252];
          d.cell.styles.fontStyle = "bold";
          d.cell.styles.textColor = [71, 85, 105];
          d.cell.styles.fontSize = 8;
        }
      },
      margin: { left: margin, right: margin },
    });

    // ===== TOTALS BLOCK =====
    const last = doc.lastAutoTable;
    const table = last?.table;
    const settings = last?.settings || {};

    const safeNum = (v, fb = 0) => (typeof v === "number" && !Number.isNaN(v) ? v : fb);

    const leftMargin = typeof settings.margin === "number" ? settings.margin : safeNum(settings?.margin?.left, margin);
    const rightMargin = typeof settings.margin === "number" ? settings.margin : safeNum(settings?.margin?.right, margin);

    const startX = safeNum(table?.startX, leftMargin);
    const tableWidth = safeNum(table?.width, 0) || (typeof table?.getWidth === "function" ? safeNum(table.getWidth(pageWidth), 0) : 0) || (pageWidth - leftMargin - rightMargin);
    const endX = startX + tableWidth;

    const finalY = safeNum(last?.finalY, 0);
    const footerY = finalY + 5;

    // Column positions
    const cols = table?.columns || [];
    const col0W = safeNum(cols?.[0]?.width ?? cols?.[0]?.wrappedWidth, 25);
    const col1W = safeNum(cols?.[1]?.width ?? cols?.[1]?.wrappedWidth, 80);
    const remaining = Math.max(tableWidth - col0W - col1W, 0);
    const col2W = safeNum(cols?.[2]?.width ?? cols?.[2]?.wrappedWidth, remaining / 2);

    const col2X = startX + col0W;
    const col3X = col2X + col1W;
    const col4X = col3X + col2W;

    const labelX = col2X + 2;
    const drX = col4X - 2;
    const crX = endX - 2;

    // TOTAL AMOUNT ROW
    doc.setFillColor(248, 250, 252);
    doc.rect(startX, footerY, tableWidth, 8, "F");

    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL AMOUNT", labelX, footerY + 5.5);

    doc.setFont("courier", "bold");
    doc.text(formatCurrency(totalDebit), drX, footerY + 5.5, { align: "right" });
    doc.text(formatCurrency(totalCredit), crX, footerY + 5.5, { align: "right" });

    // CLOSING BALANCE ROW
    doc.setFillColor(238, 242, 255);
    doc.rect(startX, footerY + 9, tableWidth, 8, "F");

    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL CLOSING BALANCE", labelX, footerY + 14.5);

    const closingDr = closingBalance > 0 ? formatCurrency(Math.abs(closingBalance)) : "";
    const closingCr = closingBalance < 0 ? formatCurrency(Math.abs(closingBalance)) : "";

    doc.setTextColor(79, 70, 229);
    doc.setFont("courier", "bold");
    doc.text(closingDr, drX, footerY + 14.5, { align: "right" });
    doc.text(closingCr, crX, footerY + 14.5, { align: "right" });

    // Borders
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.1);

    doc.rect(startX, footerY, tableWidth, 17);
    doc.line(startX, footerY + 8, endX, footerY + 8);

    doc.line(col2X, footerY, col2X, footerY + 17);
    doc.line(col3X, footerY, col3X, footerY + 17);
    doc.line(col4X, footerY, col4X, footerY + 17);

    doc.save(`${fileName}.pdf`);
  },
};
