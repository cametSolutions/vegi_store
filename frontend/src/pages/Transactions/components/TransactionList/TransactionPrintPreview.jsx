import React, { useRef, useState } from "react";
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
import { formatINR } from "../../../../../../shared/utils/currency";
import { LoaderCircle, ArrowLeft, Printer } from "lucide-react";
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
    error,
    refetch
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

  // Print size configurations - all use thermal receipt layout
  const printSizes = {
    "80mm": {
      width: "80mm",
      label: "3 Inch (80mm) - Thermal",
      pdfFormat: [80, 297],
    },
    "127mm": {
      width: "127mm",
      label: "5 Inch (127mm) - Thermal",
      pdfFormat: [127, 297],
    },
    a4: {
      width: "210mm",
      label: "A4 (210mm × 297mm) - Thermal Layout",
      pdfFormat: "a4",
    },
    letter: {
      width: "216mm",
      label: 'Letter (8.5" × 11") - Thermal Layout',
      pdfFormat: "letter",
    },
  };

  // Helper to format CR/DR for balance
  const formatWithCrDr = (value = 0) => {
    if (value < 0) return `(CR) ${Math.abs(value).toFixed(2)} `;
    if (value > 0) return ` (DR) ${value.toFixed(2)}`;
    return "0.00";
  };

  const handlePrint = () => {
    const printContent = printRef.current;

    if (printContent) {
      const printWindow = window.open("", "", "width=800,height=600");
      const currentSize = printSizes[printSize];
      const isThermal = printSize === "80mm" || printSize === "127mm";

      printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print - ${
            transaction?.transactionNumber || "Transaction"
          }</title>
          <style>
            @page {
              size: ${
                printSize === "a4"
                  ? "A4"
                  : printSize === "letter"
                  ? "letter"
                  : `${currentSize.width} auto`
              };
              margin: ${isThermal ? "0" : "10mm"};
            }
            
            html, body {
              margin: 0;
              padding: 0;
              height: auto;
            }
            
            body {
              padding: ${isThermal ? "16px" : "20px"};
              font-family: 'Courier', monospace;
              width: ${currentSize.width};
            }
            
            * { 
              box-sizing: border-box; 
            }
            
            table { 
              width: 100%; 
              border-collapse: collapse; 
            }
            
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .font-bold { font-weight: bold; }
            .border-b { border-bottom: 1px solid #000; }
            .border-t-2 { border-top: 2px solid #000; }
            .border-black { border-color: #000; }
            .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mt-4 { margin-top: 1rem; }
            .my-2 { margin-top: 0.5rem; margin-bottom: 0.5rem; }
            .space-y-1 > * + * { margin-top: 0.25rem; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .truncate { 
              overflow: hidden; 
              text-overflow: ellipsis; 
              white-space: nowrap; 
            }
            
            /* Font sizes based on print size */
            ${
              printSize === "80mm"
                ? `
              .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
              .text-xs { font-size: 0.75rem; line-height: 1rem; }
            `
                : printSize === "127mm"
                ? `
              .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
              .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
            `
                : `
              .text-2xl { font-size: 1.5rem; line-height: 2rem; }
              .text-base { font-size: 1rem; line-height: 1.5rem; }
            `
            }
            
            hr { 
              border: 0; 
              border-top: 2px solid #000; 
              margin: 0.5rem 0;
            }
            
            .max-w-100px {
              max-width: 100px;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const handleDownloadPDF = () => {
    if (!transaction) return;

    const sizeConfig = printSizes[printSize];

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: sizeConfig.pdfFormat,
    });

    // All sizes use thermal receipt layout
    generateThermalPDF(doc, transaction, printSize);

    doc.save(`${transaction?.transactionNumber || "receipt"}.pdf`);
  };

  // Thermal PDF generation for all sizes
  const generateThermalPDF = (doc, transaction, size) => {
    let yPos = 10;
    const leftMargin = 5;

    // Get page width based on size
    let pageWidth;
    if (size === "80mm") pageWidth = 80;
    else if (size === "127mm") pageWidth = 127;
    else if (size === "a4") pageWidth = 210;
    else if (size === "letter") pageWidth = 216;

    // Adjust font sizes based on width
    const fontSize = {
      title: size === "80mm" ? 12 : size === "127mm" ? 14 : 16,
      header: size === "80mm" ? 9 : size === "127mm" ? 10 : 12,
      tableHeader: size === "80mm" ? 7 : size === "127mm" ? 8 : 10,
      tableBody: size === "80mm" ? 6 : size === "127mm" ? 7 : 9,
      footer: size === "80mm" ? 8 : size === "127mm" ? 9 : 11,
    };

    // Helper for PDF CR/DR formatting
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
    doc.text(
      `DATE: ${formatDate(transaction?.transactionDate)}`,
      leftMargin,
      yPos
    );
    yPos += size === "80mm" ? 5 : size === "127mm" ? 6 : 8;
    doc.text(
      `To: ${
        transaction?.account?.accountName || transaction?.accountName || "N/A"
      }`,
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

    // Dynamic column positions based on width
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
        if (yPos > 280) {
          doc.addPage();
          yPos = 10;
        }

        doc.text(String(index + 1), col1, yPos);
        const price = item?.rate || 0;
        doc.text(String(price.toFixed(2)), col2, yPos);

        const itemName = item?.itemName || "Item";
        // Adjust max length based on size
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

    // Totals - UPDATED
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
    doc.text(formatWithCrDrForPdf(openingBalance), pageWidth - leftMargin, yPos, {
      align: "right",
    });
    yPos += 5;

    doc.text("Cash", leftMargin, yPos);
    doc.text(":", leftMargin + 30, yPos);
    doc.text(String(cash.toFixed(2)), pageWidth - leftMargin, yPos, {
      align: "right",
    });
    yPos += 5;

    doc.text("Closing Balance", leftMargin, yPos);
    doc.text(":", leftMargin + 30, yPos);
    doc.text(String(formatWithCrDrForPdf(closingBalance)), pageWidth - leftMargin, yPos, {
      align: "right",
    });
    yPos += 8;

    doc.setFont("courier", "normal");
    doc.setFontSize(fontSize.footer - 1);
    doc.text("...Thank You Visit Again...", pageWidth / 2, yPos, {
      align: "center",
    });
  };

  // Render thermal receipt preview - UPDATED
  const renderThermalPreview = () => {
    const sizeConfig = printSizes[printSize];
    const itemFontSize =
      printSize === "80mm"
        ? "text-xs"
        : printSize === "127mm"
        ? "text-sm"
        : "text-base";

    return (
      <div className="p-4">
        <div className="text-center mb-4">
          <h1
            className={`font-bold ${
              printSize === "80mm"
                ? "text-lg"
                : printSize === "127mm"
                ? "text-xl"
                : "text-2xl"
            }`}
          >
            {`ESTIMATE OF ${
              transaction?.transactionType?.toUpperCase() || "TRANSACTION"
            }`}
          </h1>
        </div>

        <div
          className={`mb-4 ${
            printSize === "80mm"
              ? "text-xs"
              : printSize === "127mm"
              ? "text-sm"
              : "text-base"
          }`}
        >
          <p>DATE: {formatDate(transaction?.transactionDate)}</p>
          <p>
            To:{" "}
            {transaction?.account?.accountName ||
              transaction?.accountName ||
              "N/A"}
          </p>
        </div>

        <hr className="border-t-2 border-black my-2" />

        <div className="mb-4">
          <table className={`w-full ${itemFontSize}`}>
            <thead>
              <tr className="border-b border-black">
                <th className="text-left py-1">SNO</th>
                <th className="text-left py-1">PRICE</th>
                <th className="text-left py-1">NAME</th>
                <th className="text-right py-1">QTY</th>
                <th className="text-right py-1">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {transaction?.items?.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="py-1">{index + 1}</td>
                  <td className="py-1">{(item?.rate || 0).toFixed(2)}</td>
                  <td
                    className={`py-1 ${
                      printSize === "80mm"
                        ? "truncate max-w-[100px]"
                        : "truncate"
                    }`}
                  >
                    {item?.itemName || "Item"}
                  </td>
                  <td className="py-1 text-right">
                    {(item?.quantity || 0).toFixed(2)}
                  </td>
                  <td className="py-1 text-right">
                    {(item?.amountAfterTax || item?.baseAmount || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <hr className="border-t-2 border-black my-2" />

        <div
          className={`space-y-1 font-bold ${
            printSize === "80mm"
              ? "text-xs"
              : printSize === "127mm"
              ? "text-sm"
              : "text-base"
          }`}
        >
          <div className="flex justify-between">
            <span>Total:</span>
            <span>{(transaction?.totalAmountAfterTax || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>{(transaction?.discountAmount || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Net Amount:</span>
            <span>{(transaction?.netAmount || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Balance (Opening):</span>
            <span>{formatWithCrDr(transaction?.openingBalance || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Cash:</span>
            <span>{(transaction?.paidAmount || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Closing Balance:</span>
            <span>{(formatWithCrDr(transaction?.balanceAmount || 0))}</span>
          </div>
        </div>

        <div
          className={`text-center mt-4 ${
            printSize === "80mm"
              ? "text-xs"
              : printSize === "127mm"
              ? "text-sm"
              : "text-base"
          }`}
        >
          <p>...Thank You Visit Again...</p>
        </div>
      </div>
    );
  };

  if (!companyId || !branchId) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-101px)]">
        <p className="text-red-500 mb-4">
          Company or Branch not selected. Please select and try again.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-101px)] bg-white">
        <LoaderCircle className="animate-spin w-8 h-8 text-slate-500" />
      </div>
    );
  }

if (isError || !transaction) {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-101px)] bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      {/* Error Icon Container */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-red-100 rounded-full blur-2xl opacity-50 animate-pulse"></div>
        <div className="relative bg-white rounded-full p-6 shadow-xl border-4 border-red-50">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>

      {/* Error Content */}
      <div className="text-center max-w-md">
        <h1 className="text-xl font-bold text-gray-800 mb-3">
          Oops! Something Went Wrong
        </h1>
        <p className="text-gray-600 mb-2 text-lg">
          We couldn't load the transaction details
        </p>
        


        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
          <button
            onClick={() =>{ refetch()}}
            className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-3 rounded-lg border-2 border-gray-300 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Try Again
          </button>
        </div>

        {/* Help Text */}
        <p className="text-sm text-gray-500 mt-8">
          If the problem persists, please contact support or check your connection.
        </p>
      </div>
    </div>
  );
}


  const currentSize = printSizes[printSize];

  return (
    <div className="h-[calc(100vh-101px)] bg-gray-500 flex flex-col">
      {/* Header with actions - FIXED AT TOP */}
      <div className="bg-white shadow-sm border-b z-10 print:hidden flex-shrink-0">
        <div className="mx-auto px-4 py-4 shadow-lg">
          {/* Top Row: Back button and Action buttons */}
          <div className="flex items-center justify-between text-sm">
            {/* <button
              onClick={() => navigate(-1,{ replace: true })}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 font-bold" />
              <span className="font-bold">Back</span>
            </button> */}
            <div></div>
            <div className="flex gap-2">
              <label
                htmlFor="printSize"
                className="text-sm px-4 py-2 font-medium text-gray-700"
              >
                Print Size:
              </label>
              <select
                id="printSize"
                value={printSize}
                onChange={(e) => setPrintSize(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                {Object.entries(printSizes).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleDownloadPDF}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download PDF
              </button>
              <button
                onClick={handlePrint}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <Printer className="w-5 h-5" />
                Print
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SCROLLABLE CONTENT AREA */}
      <div className="flex-1 overflow-auto">
        {/* Print Preview Content */}
        <div className="max-w-4xl mx-auto py-8 px-4 print:p-0 print:max-w-full">
          <div
            ref={printRef}
            className="bg-white shadow-lg mx-auto print:shadow-none transition-all duration-300"
            style={{
              width: currentSize.width,
              minHeight: "200mm",
              fontFamily: "Courier, monospace",
            }}
          >
            {renderThermalPreview()}
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            size: ${
              printSize === "a4"
                ? "A4"
                : printSize === "letter"
                ? "letter"
                : `${currentSize.width} auto`
            };
            margin: ${
              printSize === "80mm" || printSize === "127mm" ? "0" : "10mm"
            };
          }

          html, body {
            margin: 0;
            padding: 0;
            height: auto;
          }

          body {
            margin: 0;
            padding: 0;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:p-0 {
            padding: 0 !important;
          }

          .print\\:max-w-full {
            max-width: 100% !important;
          }

          .print\\:shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default TransactionPrintPreview;