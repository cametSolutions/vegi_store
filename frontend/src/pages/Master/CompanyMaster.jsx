import DynamicForm from "../../components/form/DynamicForm"
import { companyApi } from "../../api/companyApi"
import {  CompanySchema } from "../../validation/companySchema"
import getLocalStorageItem from "../../helper/getlocalstorage"


const CompanyMaster = () => {

const selectedCompany=getLocalStorageItem("selectedCompany")
const selectedBranch=getLocalStorageItem("selectedBranch")


  const sampleFields = [
    {
      name: "companyName",
      label: "company Name",
      type: "text",
      placeholder: "veggieshop",
      validation: {
        minLength: { value: 2, message: "Minimum 2 characters required" }
      }
    },
    { name: "companyType", label: "Company Type", type: "text" },
    { name: "registrationNumber", label: "Registration Number", type: "text" },
    { name: "incorporationDate", label: "Incorporation Date", type: "date" },
    { name: "permanentAddress", label: "Permanent Address", type: "text" },
    { name: "residentialAddress", label: "Residential Address", type: "text" },
    { name: "email", label: "Email", type: "email" },
    { name: "notificationEmail", label: "Notification Email", type: "email" },
    { name: "mobile", label: "Mobile Number", type: "text" },
    { name: "landline", label: "Landline Number", type: "text" },
    { name: "gstNumber", label: "GST Number", type: "text" },
    { name: "panNumber", label: "PAN Number", type: "text" },
    { name: "website", label: "Website", type: "text" },
    { name: "industry", label: "Industry / Business Category", type: "text" },
    {
      name: "authorizedSignatory",
      label: "Authorized Signatory",
      type: "text"
    },
    { name: "numEmployees", label: "Number of Employees", type: "number" }
  ]

  const handleSubmit = async (data) => {
    try {
      const response = await companyApi.create(data)
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
        schema={CompanySchema}
      />
    </div>
  )
}
export default CompanyMaster
