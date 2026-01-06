import React, { useState, useEffect } from "react";
import { Printer, Download, ChevronDown, Check, X } from "lucide-react";
import { BsFileEarmarkPdfFill } from "react-icons/bs";
import { BsFileEarmarkExcelFill } from "react-icons/bs";

// 1. Mini Progress Component (Internal)
// 1. Mini Progress Component (Corrected)
const CircularProgress = ({ progress = 0 }) => {
  const size = 16;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // Ensure progress is between 0 and 100 to prevent math errors
  const safeProgress = Math.min(Math.max(progress, 0), 100);
  const offset = circumference - (safeProgress / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Background Ring */}
      <svg className="absolute transform -rotate-90" width={size} height={size}>
        {/* FIX: <circle> not ircle */}
        <circle
          className="text-slate-200"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress Value Ring */}
        {/* FIX: <circle> not ircle */}
        <circle
          className="text-indigo-600 transition-all duration-300 ease-in-out"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
    </div>
  );
};

const DownloadButton = ({
  onDownload,
  formats = ["excel", "pdf"],
  disabled = false,
  isDownloading = false, // Received from parent
  progress = 0, // Received from parent
  status = "idle", // 'idle' | 'completed' | 'failed'
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Auto-close dropdown when download starts
  useEffect(() => {
    if (isDownloading) setDropdownOpen(false);
  }, [isDownloading]);

  const handleFormatSelect = (format) => {
    setDropdownOpen(false);
    onDownload(format);
  };

  // Determine what icon to show in the main button
  const renderIcon = () => {
    if (status === "completed")
      return <Check className="w-4 h-4 text-green-600" />;
    if (status === "failed") return <X className="w-4 h-4 text-red-500" />;
    if (isDownloading) return <CircularProgress progress={progress} />;

    // Default Idle State
    return <Download className="w-4 h-4" />;
  };

  return (
    <div className="flex items-center gap-3 z-50">
      <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200">
        {/* <button
          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-md transition-all shadow-sm"
          title="Print"
          onClick={() => window.print()}
          disabled={isDownloading} // Disable print while downloading
        >
          <Printer className="w-4 h-4" />
        </button> */}

        <div className="w-px h-4 bg-slate-200 mx-1"></div>

        <div className="relative">
          <button
            className={`p-1.5 text-slate-500 hover:bg-white rounded-md transition-all shadow-sm flex items-center gap-1 ${
              disabled || isDownloading
                ? "cursor-not-allowed opacity-80"
                : "hover:text-indigo-600"
            }`}
            title={
              isDownloading
                ? `Downloading... ${Math.round(progress)}%`
                : "Download"
            }
            // Only toggle dropdown if NOT downloading and NOT disabled
            onClick={() =>
              !isDownloading && !disabled && setDropdownOpen(!dropdownOpen)
            }
            disabled={disabled || isDownloading}
          >
            {/* Dynamic Icon Swapping */}
            {renderIcon()}

            {/* Hide Chevron when downloading to keep it clean */}
            {!isDownloading && status === "idle" && (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          {dropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />

              {/* Dropdown menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                {/* {formats.includes("excel") && (
                  <button
                    onClick={() => handleFormatSelect("excel")}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
                  >
                      <BsFileEarmarkExcelFill />
                    Download as Excel
                  </button>
                )} */}
                {formats.includes("pdf") && (
                  <button
                    onClick={() => handleFormatSelect("pdf")}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
                  >
                    <BsFileEarmarkPdfFill />
                  
                    Download as PDF
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DownloadButton;
