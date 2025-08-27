import DynamicForm from "../../components/form/DynamicForm"
import { createCompany } from "../../api/CompanyApi"
export interface CompanyFormData {
  companyName: string
  companyType?: string
  registrationNumber?: string
  incorporationDate?: string
  permanentAddress?: string
  residentialAddress?: string
  email: string
  notificationEmail?: string
  mobile?: string
  landline?: string
  gstNumber?: string
  panNumber?: string
  website?: string
  industry?: string
  authorizedSignatory?: string
  numEmployees?: number
}

interface Field {
  name: keyof CompanyFormData // ensures field name matches the form data keys
  label: string
  type: string
  placeholder?: string
  validation?: any
}
const CompanyMaster = () => {
  const sampleFields: Field[] = [
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

  const handleSubmit = async (data: any) => {
    try {
      const response = await createCompany(data)
    } catch (error) {
      console.log(error)
    }
  }

  const customButtons = [
    {
      label: "Save Draft",
      action: () => alert("Draft saved!"),
      variant: "secondary" as const
    },
    {
      label: "Cancel",
      action: () => alert("Form cancelled!"),
      variant: "danger" as const
    }
  ]

  return (
    <DynamicForm
      fields={sampleFields}
      onSubmit={handleSubmit}
      buttons={customButtons}
      title="Professional Contact Form"
      subtitle="We'd love to hear from you. Send us a message and we'll respond as soon as possible."
    />
  )
}
export default CompanyMaster
