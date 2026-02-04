import React, { useRef, useState, useEffect } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { transactionQueries } from "@/hooks/queries/transaction.queries";
import { useSelector } from "react-redux";
import { formatDate } from "../../../../../../shared/utils/date";
import { 
  Loader2, 
  ArrowLeft, 
  Printer, 
  Download, 
  FileText, 
  ChevronDown 
} from "lucide-react";
import jsPDF from "jspdf";

const TransactionPrintPreview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { transactionId } = useParams();
  const [searchParams] = useSearchParams();
  const transactionType = searchParams.get("type") || "sale";

  const printRef = useRef();

  // Print size selector state
  const [printSize, setPrintSize] = useState("80mm");
  const [contentHeight, setContentHeight] = useState("auto");

  const selectedCompanyFromStore = useSelector(
    (state) => state?.company?.selectedCompany
  );
  const selectedBranchFromStore = useSelector(
    (state) => state?.branch?.selectedBranch
  );

  const companyId = selectedCompanyFromStore?._id || location.state?.companyId;
  const branchId = selectedBranchFromStore?._id || location.state?.branchId;

  const {
    data: transactionResponse,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    ...transactionQueries.getTransactionById(
      companyId,
      branchId,
      transactionId,
      transactionType
    ),
    enabled: Boolean(companyId && branchId && transactionId),
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  const transaction = transactionResponse;

  // Calculate content height dynamically
  useEffect(() => {
    if (printRef.current && transaction) {
      setTimeout(() => {
        const height = printRef.current.scrollHeight;
        setContentHeight(`${height}px`);
      }, 100);
    }
  }, [transaction, printSize]);

  // Print size configurations
  const printSizes = {
    "80mm": {
      width: "80mm",
      label: "3 Inch (80mm) Thermal",
      pdfFormat: [80, 297],
    },
    "127mm": {
      width: "127mm",
      label: "5 Inch (127mm) Thermal",
      pdfFormat: [127, 297],
    },
    a4: {
      width: "210mm",
      label: "A4 Standard",
      pdfFormat: "a4",
    },
    letter: {
      width: "216mm",
      label: 'US Letter',
      pdfFormat: "letter",
    },
  };

  const formatWithCrDr = (value = 0) => {
    if (value < 0) return `(CR) ${Math.abs(value).toFixed(2)} `;
    if (value > 0) return ` (DR) ${value.toFixed(2)}`;
    return "0.00";
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!transaction || !printRef.current) return;

    const element = printRef.current;
    // Calculate actual content height
    const contentHeightMM = (element.scrollHeight * 0.264583); // Convert px to mm

    let pdfWidth;
    let pdfHeight;

    if (printSize === "80mm") {
      pdfWidth = 80;
      pdfHeight = Math.max(contentHeightMM, 100); // Minimum 100mm
    } else if (printSize === "127mm") {
      pdfWidth = 127;
      pdfHeight = Math.max(contentHeightMM, 100);
    } else if (printSize === "a4") {
      pdfWidth = 210;
      pdfHeight = 297;
    } else if (printSize === "letter") {
      pdfWidth = 216;
      pdfHeight = 279;
    }

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [pdfWidth, pdfHeight],
    });

    generateThermalPDF(doc, transaction, printSize, pdfHeight);
    doc.save(`${transaction?.transactionNumber || "receipt"}.pdf`);
  };

  const generateThermalPDF = (doc, transaction, size, pageHeight) => {
    // ... [Logic remains mostly same, keeping it standard for PDF generation]
    let yPos = 10;
    const leftMargin = 5;

    let pageWidth;
    if (size === "80mm") pageWidth = 80;
    else if (size === "127mm") pageWidth = 127;
    else if (size === "a4") pageWidth = 210;
    else if (size === "letter") pageWidth = 216;

    const fontSize = {
      title: size === "80mm" ? 12 : size === "127mm" ? 14 : 16,
      header: size === "80mm" ? 9 : size === "127mm" ? 10 : 12,
      tableHeader: size === "80mm" ? 7 : size === "127mm" ? 8 : 10,
      tableBody: size === "80mm" ? 6 : size === "127mm" ? 7 : 9,
      footer: size === "80mm" ? 8 : size === "127mm" ? 9 : 11,
    };

    const formatWithCrDrForPdf = (value = 0) => {
      if (value < 0) return `CR ${Math.abs(value).toFixed(2)}`;
      if (value > 0) return `DR ${value.toFixed(2)}`;
      return "0.00";
    };

    // Title
    doc.setFontSize(fontSize.title);
    doc.setFont("courier", "bold");
    const transactionTypeText = `ESTIMATE OF ${
      transaction?.transactionType?.toUpperCase() || "TRANSACTION"
    }`;

    doc.text(transactionTypeText, pageWidth / 2, yPos, { align: "center" });
    yPos += 8;

    // Date and Account
    doc.setFontSize(fontSize.header);
    doc.setFont("courier", "normal");
    doc.text(`DATE: ${formatDate(transaction?.transactionDate)}`, leftMargin, yPos);
    yPos += size === "80mm" ? 5 : size === "127mm" ? 6 : 8;
    doc.text(
      `To: ${transaction?.account?.accountName || transaction?.accountName || "N/A"}`,
      leftMargin,
      yPos
    );
    yPos += size === "80mm" ? 8 : size === "127mm" ? 10 : 12;

    // Line
    doc.line(leftMargin, yPos, pageWidth - leftMargin, yPos);
    yPos += 3;

    // Table header
    doc.setFontSize(fontSize.tableHeader);
    doc.setFont("courier", "bold");

    const col1 = leftMargin;
    const col2 = leftMargin + pageWidth * 0.1;
    const col3 = leftMargin + pageWidth * 0.3;
    const col4 = leftMargin + pageWidth * 0.6;
    const col5 = pageWidth - leftMargin - 10;

    doc.text("SNO", col1, yPos);
    doc.text("PRICE", col2, yPos);
    doc.text("NAME", col3, yPos);
    doc.text("QTY", col4, yPos);
    doc.text("AMOUNT", col5, yPos);
    yPos += 4;

    doc.line(leftMargin, yPos, pageWidth - leftMargin, yPos);
    yPos += 4;

    // Items
    doc.setFont("courier", "normal");
    doc.setFontSize(fontSize.tableBody);

    if (transaction?.items && Array.isArray(transaction.items)) {
      transaction.items.forEach((item, index) => {
        doc.text(String(index + 1), col1, yPos);
        const price = item?.rate || 0;
        doc.text(String(price.toFixed(2)), col2, yPos);

        const itemName = item?.itemName || "Item";
        let maxLength;
        if (size === "80mm") maxLength = 18;
        else if (size === "127mm") maxLength = 30;
        else if (size === "a4") maxLength = 50;
        else maxLength = 50;

        const truncatedName =
          itemName.length > maxLength
            ? itemName.substring(0, maxLength)
            : itemName;
        doc.text(truncatedName, col3, yPos);

        const quantity = item?.quantity || 0;
        doc.text(String(quantity.toFixed(2)), col4, yPos);

        const amount = item?.amountAfterTax || item?.baseAmount || 0;
        doc.text(String(amount.toFixed(2)), col5, yPos);

        yPos += 4;
      });
    }

    yPos += 2;
    doc.line(leftMargin, yPos, pageWidth - leftMargin, yPos);
    yPos += 5;

    // Totals
    doc.setFont("courier", "bold");
    doc.setFontSize(fontSize.footer);

    const total = transaction?.totalAmountAfterTax || 0;
    const discount = transaction?.discountAmount || 0;
    const netAmount = transaction?.netAmount || 0;
    const openingBalance = transaction?.openingBalance || 0;
    const cash = transaction?.paidAmount || 0;
    const closingBalance = transaction?.balanceAmount || 0;

    doc.text("Total", leftMargin, yPos);
    doc.text(":", leftMargin + 30, yPos);
    doc.text(String(total.toFixed(2)), pageWidth - leftMargin, yPos, {
      align: "right",
    });
    yPos += 5;

    // ... [Rest of totals logic same]
     doc.text("Discount", leftMargin, yPos);
    doc.text(":", leftMargin + 30, yPos);
    doc.text(String(discount.toFixed(2)), pageWidth - leftMargin, yPos, {
      align: "right",
    });
    yPos += 5;

    doc.text("Net Amount", leftMargin, yPos);
    doc.text(":", leftMargin + 30, yPos);
    doc.text(String(netAmount.toFixed(2)), pageWidth - leftMargin, yPos, {
      align: "right",
    });
    yPos += 5;

    doc.text("Balance (Opening)", leftMargin, yPos);
    doc.text(":", leftMargin + 30, yPos);
    doc.text(
      formatWithCrDrForPdf(openingBalance),
      pageWidth - leftMargin,
      yPos,
      {
        align: "right",
      }
    );
    yPos += 5;

    doc.text("Cash", leftMargin, yPos);
    doc.text(":", leftMargin + 30, yPos);
    doc.text(String(cash.toFixed(2)), pageWidth - leftMargin, yPos, {
      align: "right",
    });
    yPos += 5;

    doc.text("Closing Balance", leftMargin, yPos);
    doc.text(":", leftMargin + 30, yPos);
    doc.text(
      String(formatWithCrDrForPdf(closingBalance)),
      pageWidth - leftMargin,
      yPos,
      {
        align: "right",
      }
    );
    yPos += 8;

    doc.setFont("courier", "normal");
    doc.setFontSize(fontSize.footer - 1);
    doc.text("...Thank You Visit Again...", pageWidth / 2, yPos, {
      align: "center",
    });
  };

  const renderThermalPreview = () => {
    const itemFontSize =
      printSize === "80mm"
        ? "text-[10px] leading-tight"
        : printSize === "127mm"
        ? "text-xs"
        : "text-sm";
    
    const headerSize = printSize === "80mm" ? "text-sm" : "text-base";
    const smallText = printSize === "80mm" ? "text-[10px]" : "text-xs";

    return (
      <div className="p-4 text-black">
        {/* Header */}
        <div className="text-center mb-3">
          <h1 className={`font-bold uppercase tracking-wide ${headerSize}`}>
            Estimate of {transaction?.transactionType || "Transaction"}
          </h1>
        </div>

        {/* Meta Data */}
        <div className={`mb-3 space-y-1 ${smallText} font-medium`}>
          <div className="flex justify-between">
            <span>DATE:</span>
            <span>{formatDate(transaction?.transactionDate)}</span>
          </div>
          <div className="flex gap-1">
            <span className="shrink-0">TO:</span>
            <span className="uppercase break-words">
              {transaction?.account?.accountName || transaction?.accountName || "N/A"}
            </span>
          </div>
        </div>

        {/* Separator - Dashed for thermal look */}
        <div className="border-b border-dashed border-black my-2" />

        {/* Items Table */}
        <div className="mb-3">
          <table className={`w-full ${itemFontSize}`}>
            <thead>
              <tr className="border-b border-dashed border-black">
                <th className="text-left py-1 w-[8%]">#</th>
                <th className="text-left py-1 w-[20%]">Rate</th>
                <th className="text-left py-1 w-[40%]">Item</th>
                <th className="text-right py-1 w-[12%]">Qty</th>
                <th className="text-right py-1 w-[20%]">Amt</th>
              </tr>
            </thead>
            <tbody className="font-medium">
              {transaction?.items?.map((item, index) => (
                <tr key={index}>
                  <td className="py-1 align-top">{index + 1}</td>
                  <td className="py-1 align-top">{(item?.rate || 0).toFixed(2)}</td>
                  <td className={`py-1 align-top ${printSize === "80mm" ? "truncate max-w-[80px]" : ""}`}>
                    {item?.itemName || "Item"}
                  </td>
                  <td className="py-1 align-top text-right">{(item?.quantity || 0).toFixed(2)}</td>
                  <td className="py-1 align-top text-right">
                    {(item?.amountAfterTax || item?.baseAmount || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-b border-dashed border-black my-2" />

        {/* Totals Section */}
        <div className={`space-y-1 font-bold ${smallText}`}>
          {[
            { label: "Total", value: (transaction?.totalAmountAfterTax || 0).toFixed(2) },
            { label: "Discount", value: (transaction?.discountAmount || 0).toFixed(2) },
            { label: "Net Amount", value: (transaction?.netAmount || 0).toFixed(2), isMain: true },
            { label: "Bal (Opening)", value: formatWithCrDr(transaction?.openingBalance || 0) },
            { label: "Cash Paid", value: (transaction?.paidAmount || 0).toFixed(2) },
            { label: "Closing Bal", value: formatWithCrDr(transaction?.balanceAmount || 0) },
          ].map((row, i) => (
            <div key={i} className={`flex justify-between ${row.isMain ? 'text-[1.1em] mt-1 mb-1' : ''}`}>
              <span>{row.label}:</span>
              <span>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={`text-center mt-6 ${smallText}`}>
          <p className="uppercase tracking-widest font-medium">*** Thank You ***</p>
          <p className="text-[9px] mt-1">Visit Again</p>
        </div>
      </div>
    );
  };

  if (!companyId || !branchId) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-sm border">
          <p className="text-red-500 mb-4 font-medium">Company or Branch not selected.</p>
          <button
            onClick={() => navigate(-1)}
            className="text-sm bg-slate-900 text-white px-5 py-2.5 rounded-md hover:bg-slate-800 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin w-8 h-8 text-slate-600" />
          <span className="text-sm text-slate-500 font-medium">Loading preview...</span>
        </div>
      </div>
    );
  }

  if (isError || !transaction) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
         <div className="text-center p-8 bg-white rounded-xl shadow-sm border max-w-md">
           <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
             <ArrowLeft className="text-red-600 w-6 h-6" />
           </div>
           <h3 className="text-lg font-bold text-gray-900 mb-2">Details Unavailable</h3>
           <p className="text-gray-500 text-sm mb-6">We couldn't retrieve the transaction details. It might have been deleted or you're offline.</p>
           
           <div className="flex gap-3 justify-center">
             <button onClick={() => navigate(-1)} className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50">Cancel</button>
             <button onClick={() => refetch()} className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm hover:bg-slate-800">Retry</button>
           </div>
         </div>
      </div>
    );
  }

  const currentSize = printSizes[printSize];

  return (
    <div className="h-[calc(100vh-110px)] bg-gray-100/80 flex flex-col font-sans">
      
      {/* PROFESSIONAL HEADER / TOOLBAR */}
      <div className="bg-white border-b border-gray-200 shadow-sm z-20 print:hidden shrink-0 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Left: Branding & Back */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <span className="font-semibold text-gray-900">Print Preview</span>
              <span className="text-xs text-gray-500 font-medium">
                #{transaction?.transactionNumber} • {transactionType.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-3">
            {/* Size Selector */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <FileText className="w-4 h-4 text-gray-400" />
              </div>
              <select
                value={printSize}
                onChange={(e) => setPrintSize(e.target.value)}
                className="pl-9 pr-8 py-2 bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-md focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none appearance-none hover:bg-white transition-colors cursor-pointer min-w-[160px]"
              >
                {Object.entries(printSizes).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </div>
            </div>

            <div className="h-6 w-px bg-gray-200 mx-1"></div>

            {/* Actions */}
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-slate-900 transition-all shadow-sm active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              <span>PDF</span>
            </button>
            
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-all shadow-md active:scale-[0.98] hover:shadow-lg"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN PREVIEW AREA */}
      <div className="flex-1 overflow-auto py-8 px-4 flex justify-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
        <div className="w-full max-w-fit animate-in fade-in zoom-in-95 duration-300">
          
          {/* The "Paper" */}
          <div
            ref={printRef}
            id="print-content"
            className="bg-white mx-auto print:shadow-none transition-all duration-300 relative"
            style={{
              width: currentSize.width,
              minHeight: "fit-content",
              fontFamily: "'Courier Prime', 'Courier New', monospace", // Thermal font
              boxShadow: "rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px",
            }}
          >
            {/* Preview Content */}
            {renderThermalPreview()}
          </div>

          <p className="text-center text-xs text-gray-400 mt-6 print:hidden">
            Previewing {currentSize.width} layout
          </p>
        </div>
      </div>

      {/* Global Print Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');

        @media print {
          @page {
            size: ${currentSize.width} auto;
            margin: 0;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            overflow: visible !important;
          }

          /* Hide UI elements */
          .print\\:hidden, header, nav, button {
            display: none !important;
          }

          /* Ensure content prints correctly */
          #print-content {
            width: ${currentSize.width} !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            position: absolute;
            left: 0;
            top: 0;
          }

          /* Force black text for thermal printers */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color: #000 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default TransactionPrintPreview;
