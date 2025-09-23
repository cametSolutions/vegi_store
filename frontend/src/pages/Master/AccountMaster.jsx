import  { useEffect, useState } from "react"
import {
  Search,
  Filter,
  DollarSign,
  Phone,
  User,
  Building,
  MapPin,
  AlertCircle,
  CheckCircle2
} from "lucide-react"
import {
  
  AccountmasterSchema
} from "../../validation/accountmasterSchema"
import { accountmasterApi } from "../../api/accountMasterApi"
import { pricelevelApi } from "../../api/pricelevelApi"
import { ZodError } from "zod"
import { useSelector } from "react-redux"

const AccountMaster = () => {
  // Your existing input fields
  const inputFields= [
    {
      name: "accountName",
      label: "Account Name",
      type: "text",
      placeholder: "Enter account name"
    },
    {
      name: "accountType",
      label: "Account Type",
      type: "radio"
    },
    {
      name: "pricelevel",
      label: "Price Level Type",
      type: "select"
    },
    {
      name: "openingBalance",
      label: "Opening Balance",
      type: "text",
      placeholder: "0.00"
    },
    {
      name: "openingBalanceType",
      label: "Opening Balance Type",
      type: "select"
    },
    {
      name: "address",
      label: "Address",
      type: "text",
      placeholder: "Enter address"
    },
    {
      name: "phoneNo",
      label: "Phone No",
      type: "text",
      placeholder: "+91-XXXXXXXXXX"
    }
  ]

  // State management
  const [accntholdersList, setaccntholdersList] = useState([])
  const [accounts, setAccounts] = useState([
    {
      id: 1,
      accountName: "John Doe",
      accountType: "Savings",
      pricelevel: "Standard",
      openingBalance: 15000,
      openingBalanceType: "Credit",
      address: "123 Main St, Mumbai",
      phoneNumber: "9876543210"
    },
    {
      id: 2,
      accountName: "Jane Smith",
      accountType: "Current",
      pricelevel: "Premium",
      openingBalance: 25000,
      openingBalanceType: "Debit",
      address: "456 Park Ave, Delhi",
      phoneNumber: "9876543211"
    },
    {
      id: 3,
      accountName: "Michael Brown",
      accountType: "Savings",
      pricelevel: "Standard",
      openingBalance: 18000,
      openingBalanceType: "Credit",
      address: "789 Oak Rd, Bangalore",
      phoneNumber: "9876543212"
    },
    {
      id: 4,
      accountName: "Emily Davis",
      accountType: "Current",
      pricelevel: "Premium",
      openingBalance: 30000,
      openingBalanceType: "Credit",
      address: "321 Pine St, Chennai",
      phoneNumber: "9876543213"
    },
    {
      id: 5,
      accountName: "Chris Wilson",
      accountType: "Savings",
      pricelevel: "Basic",
      openingBalance: 12000,
      openingBalanceType: "Debit",
      address: "654 Elm Ave, Pune",
      phoneNumber: "9876543214"
    },
    {
      id: 6,
      accountName: "Olivia Miller",
      accountType: "Current",
      pricelevel: "Premium",
      openingBalance: 27000,
      openingBalanceType: "Credit",
      address: "987 Cedar Ln, Hyderabad",
      phoneNumber: "9876543215"
    }
  ])

  const [formData, setFormData] = useState({
    accountName: "",
    accountType: "",
    pricelevel: "",
    openingBalance: "",
    openingBalanceType: "",
    address: "",
    phoneNo: ""
  })

  const [errors, setErrors] = useState({})
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedHolder, setselectedHolder] = useState(null)
  const [filterType, setFilterType] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [pricelevelOptions, setpricelevelOptions] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const selectedCompany = useSelector(
    (state) => state.companyBranch.selectedCompany
  )
  const selectedBranch = useSelector(
    (state) => state.companyBranch.selectedBranch
  )

  useEffect(() => {
    const fetchPricelevel = async () => {
      try {
        const res = await pricelevelApi.getAll()
        setpricelevelOptions(res.data)
      } catch (err) {
        console.error("Error fetching pricelevel", err)
      }
    }

    fetchPricelevel()
  }, [])
console.log("formdata",formData)
  useEffect(() => {
    const fetchAccntholder = async () => {
      try {
        const res = await accountmasterApi.getAll()
        setaccntholdersList(res.data)
      } catch (error) {
        console.error(error)
      }
    }
    fetchAccntholder()
  }, [])

  // Validate form using Zod schema
  const validateForm = (
    data
  ) => {
    try {
      AccountmasterSchema.parse(data)
      return {}
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors= {}
        error.issues.forEach((err) => {
          if (err.path[0]) {
            validationErrors[err.path[0]] = err.message
          }
        })
        return validationErrors
      }
      return {}
    }
  }

  // Validate single field
  const validateField = (name, value) => {
    try {
      const singleFieldSchema = AccountmasterSchema.pick({ [name]: true })
      singleFieldSchema.parse({ [name]: value })
      setErrors((prev) => ({ ...prev, [name]: "" }))
    } catch (error) {
      if (error instanceof ZodError) {
       
        const message = error.issues[0]?.message || "Invalid input"
        setErrors((prev) => ({
          ...prev,
          [name]: message
        }))
      }
    }
  }

  // Handle form input changes with real-time validation
  const handleInputChange = (
    name,
    value
  ) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))

    // Clear success message
    setSubmitSuccess(false)

    // Real-time validation for required fields
    if (["accountName", "accountType", "pricelevel"].includes(name)) {
      validateField(name, value)
    }
  }
console.log("selectedholder",selectedHolder)
  // Handle form submission with Zod validation
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate entire form
    const validationErrors = validateForm(formData)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }
    const finalFormData = {
      ...formData,
      companyId: selectedCompany?._id || "",
      branchId: selectedBranch?._id || ""
    }

    setIsSubmitting(true)
    try {
      let response
      if (selectedHolder) {
        response = await accountmasterApi.update(
          {
            id: selectedHolder._id,
            companyId: selectedHolder.companyId,
            branchId: selectedHolder.branchId
          },
          finalFormData
        )
      } else {
        response = await accountmasterApi.create(finalFormData)
      }

      console.log("response", response.data)
      setaccntholdersList(response.data)
      setFormData({
        accountName: "",
        accountType: "",
        pricelevel: "",
        openingBalance: "",
        openingBalanceType: "",
        address: "",
        phoneNo: ""
      })

      setErrors({})
      setSubmitSuccess(true)
    } catch (error) {
      console.log("Form submission error:", error)
    } finally {
      setIsSubmitting(false)
    }

  
  }

  // Handle edit
  const handleEdit = (account) => {
    setFormData({
      accountName: account.accountName,
      accountType: account.accountType,
      pricelevel: account.pricelevel,
      openingBalance: account.openingBalance.toString(),
      openingBalanceType: account.openingBalanceType,
      address: account.address,
      phoneNo: account.phoneNumber
    })
    setIsEditing(true)
    setEditingId(account.id)
    setSubmitSuccess(false)
    setErrors({})
  }

  // Handle delete
  const handleDelete = async () => {
    if (selectedHolder) {
      console.log("seelctectdid", selectedHolder)
      const result = await accountmasterApi.delete({
        id: selectedHolder._id,
        companyId: selectedHolder.companyId,
        branchId: selectedHolder.branchId
      })
      setaccntholdersList(result.data)
    }
    
  }
console.log("acnnntlisttttttttttttttttt",accntholdersList)
  // Filter accounts
  const filteredAccounts = accntholdersList.filter((account) => {
    const matchesSearch =
      account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.phoneNumber.includes(searchTerm) ||
      account.address.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = !filterType || account.accountType === filterType
    return matchesSearch && matchesFilter
  })

  // Cancel edit
  const cancelEdit = () => {
    setIsEditing(false)
    setEditingId(null)
    setFormData({
      accountName: "",
      accountType: "",
      pricelevel: "",
      openingBalance: "",
      openingBalanceType: "",
      address: "",
      phoneNo: ""
    })
    setErrors({})
    setSubmitSuccess(false)
  }
  const handleSelect = (accnt) => {
    setselectedHolder(accnt)
    setFormData({
      accountName: accnt.accountName,
      accountType: accnt.accountType,
      pricelevel: accnt.pricelevel._id,
      openingBalance: accnt.openingBalance.toString(),
      openingBalanceType: accnt.openingBalanceType,
      address: accnt.address,
      phoneNo: accnt.phoneNo
    })
  }

  const getInputStyles = (fieldName) =>
    `w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 ${
      errors[fieldName]
        ? "border-red-500 focus:ring-red-500"
        : "border-gray-300"
    }`
  return (
    <div className="min-h-screen bg-blue-50 p-6 w-screen">
      <div className=" bg-white mx-auto p-3 rounded-md shadow-2xl">
        {/* Header */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Building className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Account Master
                  </h1>
                  <p className="text-gray-600">Manage your account holders</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-medium">
                  {accntholdersList.length} holders
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Form and Table Side by Side */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Form Section - Left Side */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-6">
              {/* Success Message */}
              {submitSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-green-800 text-sm font-medium">
                    Account {isEditing ? "updated" : "created"} successfully!
                  </span>
                </div>
              )}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setFormData({
                      accountName: "",
                      accountType: "",
                      pricelevel: "",
                      openingBalance: "",
                      openingBalanceType: "",
                      address: "",
                      phoneNo: ""
                    })
                    setselectedHolder(null)
                  }}
                  className="bg-blue-800 hover:bg-blue-700 text-white px-2 py-0.5 rounded-md cursor-pointer"
                >
                  Clear
                </button>
              </div>

              {/* <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-green-600" />
                  {isEditing ? "Edit Account" : "Add New Account"}
                </h2>
                {isEditing && (
                  <button
                    onClick={cancelEdit}
                    className="text-gray-500 hover:text-gray-700 text-sm px-3 py-1 rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                )}
              </div> */}

              <form
                id="accountForm"
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {inputFields.map((field, index) => (
                  <div key={index} className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label}
                      {["accountName", "accountType", "pricelevel"].includes(
                        field.name
                      ) && <span className="text-red-500 ml-1">*</span>}
                    </label>

                    {field.type === "text" && (
                      <div className="relative">
                        {field.name === "phoneNo" && (
                          <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        )}
                        {field.name === "accountName" && (
                          <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        )}
                        {field.name === "address" && (
                          <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        )}
                        {field.name === "openingBalance" && (
                          <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        )}
                        <input
                          type={
                            field.name === "openingBalance" ? "number" : "text"
                          }
                          value={formData[field.name] || ""}
                          onChange={(e) =>
                            handleInputChange(field.name, e.target.value)
                          }
                          placeholder={field.placeholder || field.label}
                          className={`${getInputStyles(field.name)} ${
                            [
                              "phoneNo",
                              "accountName",
                              "address",
                              "openingBalance"
                            ].includes(field.name)
                              ? "pl-10"
                              : ""
                          }`}
                        />
                      </div>
                    )}

                    {field.type === "radio" && (
                      <div className="space-y-2">
                        <div className="flex gap-4">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              value="Supplier"
                              checked={formData[field.name] === "Supplier"}
                              onChange={(e) =>
                                handleInputChange(field.name, e.target.value)
                              }
                              className="mr-2 text-amber-600 focus:ring-amber-500"
                            />
                            <span className="text-sm font-medium">
                              Supplier
                            </span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              value="Customer"
                              checked={formData[field.name] === "Customer"}
                              onChange={(e) =>
                                handleInputChange(field.name, e.target.value)
                              }
                              className="mr-2 text-amber-600 focus:ring-amber-500"
                            />
                            <span className="text-sm font-medium">
                              Customer
                            </span>
                          </label>
                        </div>
                      </div>
                    )}

                    {field.type === "select" && (
                      <select
                        value={formData[field.name] || ""}
                        onChange={(e) =>
                          handleInputChange(field.name, e.target.value)
                        }
                        className={getInputStyles(field.name)}
                      >
                        <option value="">Select {field.label}</option>
                        {field.name === "pricelevel" &&
                          pricelevelOptions.map((item) => (
                            <option value={item._id}>
                              {item.priceLevelName}
                            </option>
                          ))}
                        {field.name === "openingBalanceType" && (
                          <>
                            <option value="Credit">Credit</option>
                            <option value="Debit">Debit</option>
                          </>
                        )}
                      </select>
                    )}

                    {/* Error Display */}
                    {errors[field.name] && (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>{errors[field.name]}</span>
                      </div>
                    )}
                  </div>
                ))}

                {/* <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {isEditing ? "Update Account" : "Save Account"}
                  </button>
                </div> */}
              </form>
            </div>
          </div>

          {/* Table Section - Right Side */}
          <div className="w-full lg:w-2/3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Search and Filter */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search accounts, phone, or address..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                      <option value="">All Types</option>
                      <option value="Savings">Savings</option>
                      <option value="Current">Current</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                {filteredAccounts.length === 0 ? (
                  <div className="text-center py-12">
                    <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-2">
                      No accounts found
                    </p>
                    <p className="text-gray-400 text-sm">
                      {searchTerm || filterType
                        ? "Try adjusting your search or filter criteria"
                        : "Add your first account to get started"}
                    </p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-amber-50 border-b border-gray-200">
                        <th className="text-left px-6 py-4 font-semibold text-gray-700">
                          Account Name
                        </th>
                        <th className="text-left px-6 py-4 font-semibold text-gray-700">
                          Account Type
                        </th>
                        <th className="text-left px-6 py-4 font-semibold text-gray-700">
                          O.Balance
                        </th>
                        <th className="text-left px-6 py-4 font-semibold text-gray-700">
                          Address
                        </th>
                        <th className="text-left px-6 py-4 font-semibold text-gray-700">
                          Phone
                        </th>
                        {/* <th className="text-left px-6 py-4 font-semibold text-gray-700">
                          Actions
                        </th> */}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredAccounts.map((account) => (
                        <tr
                          onClick={() => handleSelect(account)}
                          key={account._id}
                          className="hover:bg-amber-50 transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-amber-100 rounded-lg">
                                <User className="w-4 h-4 text-amber-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {account.accountName}
                                </p>
                                {/* <p className="text-sm text-gray-500 truncate max-w-[200px]">
                                  {account.address}
                                </p> */}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                account.accountType === "Savings"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {account.accountType}
                            </span>
                            {/* <p className="text-xs text-gray-500 mt-1">
                              {account?.pricelevel?.priceLevelName}
                            </p> */}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <span className="font-medium text-gray-900">
                                ₹{account.openingBalance.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              {account.openingBalanceType}
                            </p>
                          </td>
                          <td className="px-6 py-4">{account.address}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">
                                {account.phoneNo}
                              </span>
                            </div>
                          </td>
                          <td>
                            {/* <div className="flex items-center gap-2">
                               <button
                                onClick={() => handleEdit(account)}
                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Edit account"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(account.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>  */}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Footer */}
              {filteredAccounts.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-amber-50">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                      Showing {filteredAccounts.length} of {accounts.length}{" "}
                      accounts
                    </span>
                    <span>
                      Total Balance:{" "}
                      <strong>
                        ₹
                        {accounts
                          .reduce((sum, acc) => sum + acc.openingBalance, 0)
                          .toLocaleString()}
                      </strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center items-center gap-4 mt-4">
              <button
                type="submit"
                form="accountForm"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition duration-200 cursor-pointer"
              >
                {selectedHolder ? "Update" : "Save"}
              </button>
              <button
                onClick={() => handleDelete()}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition duration-200 cursor-pointer"
              >
                Delete
              </button>
              <button className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition duration-200 cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountMaster
