import DynamicForm from "../../components/form/DynamicForm"
import { branchApi } from "../../api/branchApi"
import { BranchSchema } from "../../validation/branchSchema"

const BranchMaster = () => {
  const sampleFields = [
    {
      name: "branchName",
      label: "branch Name",
      type: "text",
      placeholder: "vegieshop",
      validation: {
        minLength: { value: 2, message: "Minimum 2 characters required" }
      }
    },
    {
      name: "companyId",
      label: "Company",
      type: "text",
      placeholder: "Company ID"
    },
    {
      name: "branchType",
      label: "Branch Type",
      type: "text",
      placeholder: "Main/Regional"
    },
    { name: "address", label: "Address", type: "text" },
    { name: "city", label: "City", type: "text" },
    { name: "state", label: "State", type: "text" },
    { name: "country", label: "Country", type: "text" },
    { name: "pincode", label: "Pincode", type: "text" },
    { name: "email", label: "Email", type: "email" },
    { name: "mobile", label: "Mobile Number", type: "text" },
    { name: "landline", label: "Landline Number", type: "text" },
    { name: "status", label: "Status", type: "text" } // could be dropdown if you want
  ]
  const handleSubmit = async (data) => {
    try {
      const response = await branchApi.create(data)
    } catch (error) {
      console.log(error)
    }
  }
  const customButtons = [
    {
      label: "Save Draft",
      action: () => alert("Draft saved!"),
      variant: "secondary"
    },
    {
      label: "Cancel",
      action: () => alert("Form cancelled!"),
      variant: "danger"
    }
  ]
  return (
    <div className="flex justify-center items-center w-screen">
      <DynamicForm
        fields={sampleFields}
        onSubmit={handleSubmit}
        buttons={customButtons}
        schema={BranchSchema}
      />
    </div>
  )
}
export default BranchMaster
