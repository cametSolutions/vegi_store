import DynamicForm from "../../components/form/DynamicForm"
import { userApi } from "../../api/userApi"
import { companyApi } from "../../api/companyApi"
import { branchApi } from "../../api/branchApi"
import { UserSchema, UserFormData } from "../../validation/userSchema"
import { useState, useEffect } from "react"
interface Field {
  name: keyof UserFormData //ensures field namme matches the form data keys
  label: string
  type: string
  Placeholder?: string
  validation?: any
  options?: { value: string; label: string }[]
  subFields?: Field[] // ✅ allow nested fields
}

const UserMaster = () => {
  const [fields, setFields] = useState<Field[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const fetchData = async () => {
      try {
        //Fetch companies
        const companies = await companyApi.getAll()
        const companyOptions = companies.data.map((c: any) => ({
          value: c._id,
          label: c.companyName
        }))
        //Fetch branches
        const branches = await branchApi.getAll()
        const branchOptions = branches.data.map((b: any) => ({
          value: b._id,
          label: b.branchName
        }))
        // Set up fields dynamically
        setFields([
          { name: "userName", label: "User Name", type: "text" },
          { name: "aadhar", label: "Aadhar Number", type: "text" },
          { name: "address", label: "Address", type: "text" },
          { name: "email", label: "Email", type: "text" },
          { name: "mobile", label: "Mobile", type: "text" },
          { name: "password", label: "Password", type: "text" },
          {
            name: "companyName",
            label: "Company Name",
            type: "select",
            options: companyOptions
          },
          { name: "branchName", label: "Branch Name", type: "select",options:branchOptions }
        ])
      } catch (error) {
        console.error("Error fetching companies/branches:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // const sampleFields: Field[] = [
  //   {
  //     name: "userName",
  //     label: "user Name",
  //     type: "text",
  //     validation: {
  //       minLength: { value: 2, message: "Minimum 2 characters required" }
  //     }
  //   },
  //   {
  //     name: "aadhar",
  //     label: "Aadhar Number",
  //     type: "text"
  //   },
  //   {
  //     name: "address",
  //     label: "Address",
  //     type: "text"
  //   },
  //   {
  //     name: "email",
  //     label: "Email",
  //     type: "text"
  //   },
  //   {
  //     name: "mobile",
  //     label: "Mobile",
  //     type: "text"
  //   },
  //   { name: "password", label: "Password", type: "text" }
  // ]

  const handleSubmit = async (data: UserFormData) => {
    try {
      const response = await userApi.create(data)
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
  if (loading) return <p>Loading form...</p>
  return (
    <div className="flex justify-center items-center w-screen">
      <DynamicForm<UserFormData>
        fields={fields}
        onSubmit={handleSubmit}
        buttons={customButtons}
        schema={UserSchema}
      />
    </div>
  )
}
export default UserMaster
