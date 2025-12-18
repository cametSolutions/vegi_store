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
      className={`flex flex-col items-center justify-center bg-red-50 border border-red-200 rounded-lg p-6 ${
        fullHeight ? 'h-full' : 'min-h-[200px]'
      }`}
    >
      <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      
      <h3 className="text-lg font-semibold text-red-900 mb-2">
        {title}
      </h3>
      
      <p className="text-sm text-red-700 text-center mb-4 max-w-md">
        {getErrorMessage(error)}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorDisplay;
