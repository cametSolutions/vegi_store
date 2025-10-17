"use client";
import * as React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  return (
    <div className="rounded-md border bg-white shadow-sm p-2">
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={className}
        classNames={{
          months:
            "flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium text-gray-700",
          nav: "space-x-1 flex items-center",
          nav_button:
            "h-6 w-6 bg-transparent hover:bg-gray-100 rounded text-gray-700 transition",
          table: "w-full border-collapse space-y-1",
          head_row: "flex justify-between",
          head_cell:
            "text-gray-500 rounded-md w-9 font-normal text-[0.8rem] text-center",
          row: "flex w-full mt-1",
          cell: "h-9 w-9 text-center text-sm p-0 relative",
          day: "h-9 w-9 rounded-md text-sm hover:bg-gray-100 focus:bg-gray-200 transition",
          day_selected:
            "bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700",
          day_today:
            "border border-blue-400 text-blue-700 font-semibold",
          day_outside: "text-gray-300 opacity-50",
          ...classNames,
        }}
        {...props}
      />
    </div>
  );
}
