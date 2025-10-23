import { useEffect, useState } from "react";
import {
  Search,
  Filter,
  DollarSign,
  Phone,
  User,
  Building,
  MapPin,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const AccountMaster = () => {
  const [accountsList, setAccountsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [pricelevelOptions, setPricelevelOptions] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    accountName: "",
    accountType: "",
    pricelevel: "",
    openingBalance: "",
    openingBalanceType: "",
    address: "",
    phoneNo: "",
    branch: "",
  });

  // Native validation function
  const validateForm = () => {
    const newErrors = {};

    if (!formData.branch || formData.branch.trim() === "") {
      newErrors.branch = "Please select a branch";
    }

    if (!formData.accountName || formData.accountName.trim() === "") {
      newErrors.accountName = "Account name is required";
    } else if (formData.accountName.trim().length < 2) {
      newErrors.accountName = "Account name must be at least 2 characters";
    }

    if (!formData.accountType || formData.accountType.trim() === "") {
      newErrors.accountType = "Please select an account type";
    }

    if (!formData.pricelevel || formData.pricelevel.trim() === "") {
      newErrors.pricelevel = "Please select a price level";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    setSubmitSuccess(false);
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      setTimeout(() => {
        const newAccount = {
          _id: Date.now().toString(),
          ...formData,
          pricelevel: { _id: formData.pricelevel, priceLevelName: "Standard" },
          openingBalance: parseFloat(formData.openingBalance) || 0,
        };
        
        if (selectedAccount) {
          setAccountsList(prev => prev.map(acc => 
            acc._id === selectedAccount._id ? { ...newAccount, _id: selectedAccount._id } : acc
          ));
        } else {
          setAccountsList(prev => [...prev, newAccount]);
        }
        
        handleClear();
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 3000);
        setIsSubmitting(false);
      }, 500);
    } catch (error) {
      console.error("Form submission error:", error);
      setIsSubmitting(false);
    }
  };

  // Handle account selection
  const handleSelect = (account) => {
    setSelectedAccount(account);
    setFormData({
      accountName: account.accountName || "",
      accountType: account.accountType || "",
      pricelevel: account.pricelevel?._id || "",
      openingBalance: account.openingBalance?.toString() || "",
      openingBalanceType: account.openingBalanceType || "",
      address: account.address || "",
      phoneNo: account.phoneNo || "",
      branch: account.branchId || account.branch || "",
    });
    setErrors({});
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedAccount) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectedAccount.accountName}?`
    );
    
    if (!confirmDelete) return;

    try {
      setAccountsList(prev => prev.filter(acc => acc._id !== selectedAccount._id));
      handleClear();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete account. Please try again.");
    }
  };

  // Handle clear
  const handleClear = () => {
    setFormData({
      accountName: "",
      accountType: "",
      pricelevel: "",
      openingBalance: "",
      openingBalanceType: "",
      address: "",
      phoneNo: "",
      branch: "",
    });
    setSelectedAccount(null);
    setSubmitSuccess(false);
    setErrors({});
  };

  // Filter accounts
  const filteredAccounts = accountsList.filter((account) => {
    const matchesSearch =
      account.accountName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.phoneNo?.includes(searchTerm) ||
      account.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = !filterType || account.accountType === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="h-screen bg-blue-50 flex flex-col overflow-hidden" style={{ fontSize: '9px' }}>
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-3 bg-white shadow-sm border-b">
        <div className="flex items-center justify-between">
        
         
        </div>
      </div>

      {/* Main Content - Fixed Height */}
      <div className="flex-1 overflow-hidden flex gap-3 p-3">
        {/* Form Section - Left Side (50%) - Fixed */}
        <div className="w-1/2 flex flex-col h-full">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 h-full flex flex-col">
            {/* Success Message */}
            {submitSuccess && (
              <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                <span className="text-green-800 font-medium" style={{ fontSize: '9px' }}>
                  Account {selectedAccount ? "updated" : "created"} successfully!
                </span>
              </div>
            )}

            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-semibold text-gray-800">
                {selectedAccount ? "Edit Account" : "Add New Account"}
              </h2>
              <button
                onClick={handleClear}
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-md transition"
                style={{ fontSize: '9px' }}
              >
                Clear
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="space-y-2">
                {/* Branch Selection */}
                <div className="space-y-1">
                  <label className="block font-medium text-gray-700" style={{ fontSize: '9px' }}>
                    Branch <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.branch}
                    onChange={(e) => handleInputChange("branch", e.target.value)}
                    className={`w-full px-2 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition ${
                      errors.branch ? "border-red-500" : "border-gray-300"
                    }`}
                    style={{ fontSize: '9px' }}
                  >
                    <option value="">Select Branch</option>
                    {branchOptions.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.branchName || branch.name}
                      </option>
                    ))}
                  </select>
                  {errors.branch && (
                    <div className="flex items-center gap-1 text-red-600" style={{ fontSize: '9px' }}>
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.branch}</span>
                    </div>
                  )}
                </div>

                {/* Account Name */}
                <div className="space-y-1">
                  <label className="block font-medium text-gray-700" style={{ fontSize: '9px' }}>
                    Account Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-2 top-2 w-3 h-3 text-gray-400" />
                    <input
                      type="text"
                      value={formData.accountName}
                      onChange={(e) => handleInputChange("accountName", e.target.value)}
                      placeholder="Enter account name"
                      className={`w-full pl-7 pr-2 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition ${
                        errors.accountName ? "border-red-500" : "border-gray-300"
                      }`}
                      style={{ fontSize: '9px' }}
                    />
                  </div>
                  {errors.accountName && (
                    <div className="flex items-center gap-1 text-red-600" style={{ fontSize: '9px' }}>
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.accountName}</span>
                    </div>
                  )}
                </div>

                {/* Account Type */}
                <div className="space-y-1">
                  <label className="block font-medium text-gray-700" style={{ fontSize: '9px' }}>
                    Account Type <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        value="Supplier"
                        checked={formData.accountType === "Supplier"}
                        onChange={(e) => handleInputChange("accountType", e.target.value)}
                        className="mr-1 text-amber-600 focus:ring-amber-500 w-3 h-3"
                      />
                      <span className="font-medium" style={{ fontSize: '9px' }}>Supplier</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        value="Customer"
                        checked={formData.accountType === "Customer"}
                        onChange={(e) => handleInputChange("accountType", e.target.value)}
                        className="mr-1 text-amber-600 focus:ring-amber-500 w-3 h-3"
                      />
                      <span className="font-medium" style={{ fontSize: '9px' }}>Customer</span>
                    </label>
                  </div>
                  {errors.accountType && (
                    <div className="flex items-center gap-1 text-red-600" style={{ fontSize: '9px' }}>
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.accountType}</span>
                    </div>
                  )}
                </div>

                {/* Price Level */}
                <div className="space-y-1">
                  <label className="block font-medium text-gray-700" style={{ fontSize: '9px' }}>
                    Price Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.pricelevel}
                    onChange={(e) => handleInputChange("pricelevel", e.target.value)}
                    className={`w-full px-2 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition ${
                      errors.pricelevel ? "border-red-500" : "border-gray-300"
                    }`}
                    style={{ fontSize: '9px' }}
                  >
                    <option value="">Select Price Level</option>
                    {pricelevelOptions.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.priceLevelName}
                      </option>
                    ))}
                  </select>
                  {errors.pricelevel && (
                    <div className="flex items-center gap-1 text-red-600" style={{ fontSize: '9px' }}>
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.pricelevel}</span>
                    </div>
                  )}
                </div>

                {/* Opening Balance */}
                <div className="space-y-1">
                  <label className="block font-medium text-gray-700" style={{ fontSize: '9px' }}>
                    Opening Balance
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-2 w-3 h-3 text-gray-400" />
                    <input
                      type="number"
                      value={formData.openingBalance}
                      onChange={(e) => handleInputChange("openingBalance", e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-7 pr-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                      style={{ fontSize: '9px' }}
                    />
                  </div>
                </div>

                {/* Opening Balance Type */}
                <div className="space-y-1">
                  <label className="block font-medium text-gray-700" style={{ fontSize: '9px' }}>
                    Opening Balance Type
                  </label>
                  <select
                    value={formData.openingBalanceType}
                    onChange={(e) => handleInputChange("openingBalanceType", e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    style={{ fontSize: '9px' }}
                  >
                    <option value="">Select Type</option>
                    <option value="Credit">Credit</option>
                    <option value="Debit">Debit</option>
                  </select>
                </div>

                {/* Address */}
                <div className="space-y-1">
                  <label className="block font-medium text-gray-700" style={{ fontSize: '9px' }}>
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-2 top-2 w-3 h-3 text-gray-400" />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      placeholder="Enter address"
                      className="w-full pl-7 pr-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                      style={{ fontSize: '9px' }}
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <label className="block font-medium text-gray-700" style={{ fontSize: '9px' }}>
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-2 top-2 w-3 h-3 text-gray-400" />
                    <input
                      type="text"
                      value={formData.phoneNo}
                      onChange={(e) => handleInputChange("phoneNo", e.target.value)}
                      placeholder="+91-XXXXXXXXXX"
                      className="w-full pl-7 pr-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                      style={{ fontSize: '9px' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="flex gap-2 pt-2 mt-2 border-t">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition shadow-md"
                style={{ fontSize: '9px' }}
              >
                {isSubmitting
                  ? "Saving..."
                  : selectedAccount
                  ? "Update"
                  : "Save"}
              </button>
              {selectedAccount && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition shadow-md"
                  style={{ fontSize: '9px' }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table Section - Right Side (50%) - Fixed */}
        <div className="w-1/2 flex flex-col h-full">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden">
            {/* Search and Filter - Fixed */}
            <div className="p-3 border-b border-gray-200 flex-shrink-0">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-2 top-2 w-3 h-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search accounts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-7 pr-2 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                    style={{ fontSize: '9px' }}
                  />
                </div>
                <div className="relative">
                  <Filter className="absolute left-2 top-2 w-3 h-3 text-gray-400" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="pl-7 pr-6 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
                    style={{ fontSize: '9px' }}
                  >
                    <option value="">All Types</option>
                    <option value="Supplier">Supplier</option>
                    <option value="Customer">Customer</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              {filteredAccounts.length === 0 ? (
                <div className="text-center py-8">
                  <Building className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm mb-1">No accounts found</p>
                  <p className="text-gray-400" style={{ fontSize: '9px' }}>
                    {searchTerm || filterType
                      ? "Try adjusting your search criteria"
                      : "Add your first account to get started"}
                  </p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="sticky top-0 bg-amber-50 border-b border-gray-200 z-10">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-gray-700" style={{ fontSize: '9px' }}>
                        Account Name
                      </th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-700" style={{ fontSize: '9px' }}>
                        Type
                      </th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-700" style={{ fontSize: '9px' }}>
                        Balance
                      </th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-700" style={{ fontSize: '9px' }}>
                        Phone
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredAccounts.map((account) => (
                      <tr
                        key={account._id}
                        onClick={() => handleSelect(account)}
                        className={`hover:bg-amber-50 cursor-pointer transition-colors ${
                          selectedAccount?._id === account._id
                            ? "bg-amber-100"
                            : ""
                        }`}
                      >
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-amber-100 rounded-lg flex-shrink-0">
                              <User className="w-3 h-3 text-amber-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate" style={{ fontSize: '9px' }}>
                                {account.accountName}
                              </p>
                              <p className="text-gray-500 truncate" style={{ fontSize: '8px' }}>
                                {account.address}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex px-1.5 py-0.5 rounded-full font-medium ${
                              account.accountType === "Supplier"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                            style={{ fontSize: '9px' }}
                          >
                            {account.accountType}
                          </span>
                          <p className="text-gray-500 mt-0.5" style={{ fontSize: '8px' }}>
                            {account.pricelevel?.priceLevelName}
                          </p>
                        </td>
                        <td className="px-3 py-2">
                          <div>
                            <span className="font-medium text-gray-900" style={{ fontSize: '9px' }}>
                              ₹{account.openingBalance?.toLocaleString() || 0}
                            </span>
                            <p className="text-gray-500" style={{ fontSize: '8px' }}>
                              {account.openingBalanceType}
                            </p>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-600" style={{ fontSize: '9px' }}>
                              {account.phoneNo}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer - Fixed */}
            {filteredAccounts.length > 0 && (
              <div className="px-3 py-2 border-t border-gray-200 bg-amber-50 flex-shrink-0">
                <div className="flex items-center justify-between text-gray-600" style={{ fontSize: '9px' }}>
                  <span>
                    Showing {filteredAccounts.length} of {accountsList.length} accounts
                  </span>
                  <span>
                    Total Balance:{" "}
                    <strong className="text-gray-900">
                      ₹
                      {accountsList
                        .reduce((sum, acc) => sum + (acc.openingBalance || 0), 0)
                        .toLocaleString()}
                    </strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountMaster;