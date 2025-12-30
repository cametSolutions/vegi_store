import React, { useState } from 'react';
import { Printer, Download, ChevronDown } from 'lucide-react';

const DownloadButton = ({ onDownload, formats = ['excel', 'pdf'], disabled = false }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleFormatSelect = (format) => {

    
    setDropdownOpen(false);
    onDownload(format);
  };

  return (
    <div className="flex items-center gap-3 z-50">
      <div className="flex items-center bg-slate-50 rounded-lg p-1 border border-slate-200">
        <button
          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-md transition-all shadow-sm"
          title="Print"
          onClick={() => window.print()}
        >
          <Printer className="w-4 h-4" />
        </button>
        
        <div className="w-px h-4 bg-slate-200 mx-1"></div>
        
        <div className="relative">
          <button
            className={`p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-md transition-all shadow-sm flex items-center gap-1 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Download"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            disabled={disabled}
          >
            <Download className="w-4 h-4" />
            <ChevronDown className="w-3 h-3" />
          </button>

          {dropdownOpen && (
            <>
              {/* Backdrop to close dropdown */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setDropdownOpen(false)}
              />
              
              {/* Dropdown menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                {formats.includes('excel') && (
                  <button
                    onClick={() => handleFormatSelect('excel')}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
                  >
                    <span className="text-lg">📊</span>
                    Download as Excel
                  </button>
                )}
                {formats.includes('pdf') && (
                  <button
                    onClick={() => handleFormatSelect('pdf')}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2"
                  >
                    <span className="text-lg">📄</span>
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
