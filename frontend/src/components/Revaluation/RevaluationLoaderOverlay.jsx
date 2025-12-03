import React from "react";
import { useSelector } from "react-redux";

const CircularProgress = ({ progress }) => {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-muted/30"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          className="text-primary transition-all duration-300 ease-out"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold text-primary">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};

const RevaluationLoaderOverlay = () => {
  const { show, progress, message } = useSelector(
    (state) => state.revaluationLoader
  );

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col items-center gap-4 p-8 rounded-xl  ">
        <CircularProgress progress={progress} />
        <p className="text-lg font-semibold text-white">
          Running Revaluation
        </p>
        <p className="text-sm text-gray-200 text-center">{message}</p>
      </div>
    </div>
  );
};

export default RevaluationLoaderOverlay;
