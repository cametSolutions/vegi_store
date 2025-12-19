// src/components/common/ErrorDisplay.jsx
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const ErrorDisplay = ({ 
  error, 
  onRetry, 
  title = "Something went wrong",
  fullHeight = false 
}) => {
  const getErrorMessage = (error) => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.response?.data?.message) return error.response.data.message;
    return 'An unexpected error occurred. Please try again.';
  };

  return (
    <div 
      className={`flex flex-col items-center justify-center  border border-red-200 p-6 w-full ${
        fullHeight ? 'h-full' : 'min-h-[200px]'
      }`}
    >
      <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      
      <h3 className="text-sm font-semibold text-red-900 mb-2">
        {title}
      </h3>
    
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-xs"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay;
