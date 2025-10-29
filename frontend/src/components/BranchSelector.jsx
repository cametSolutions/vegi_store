// components/BranchSelector.jsx
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useSelector } from "react-redux";

const BranchSelector = ({
  selectedBranches,
  setSelectedBranches,
}) => {
  const branches = useSelector((state) => state.companyBranch?.branches) || [];

  const handleBranchToggle = (branchId) => {
    setSelectedBranches((prev) =>
      prev.includes(branchId)
        ? prev.filter((id) => id !== branchId)
        : [...prev, branchId]
    );
  };


  return (
    <div className="mt-4">
      <Label>Available Branches *</Label>
      <div className="space-y-2 mt-2 border rounded p-3">
        {branches.map((branch) => (
          <div key={branch._id} className="flex items-center space-x-2">
            <Checkbox
              id={branch._id}
              checked={selectedBranches.includes(branch._id)}
              onCheckedChange={() => handleBranchToggle(branch._id)}
            />
            <Label htmlFor={branch._id} className="cursor-pointer">
              {branch.branchName}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BranchSelector;
