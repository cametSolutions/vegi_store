import DynamicForm from "../../components/form/DynamicForm"
import { userApi } from "../../api/services/user.service"
import { companyApi } from "../../api/companyApi"
import { branchApi } from "../../api/branchApi"
import { UserSchema} from "../../validation/userSchema"
import { useState, useEffect } from "react"

const UserMaster = () => {
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const fetchData = async () => {
      try {
        //Fetch companies
        const companies = await companyApi.getAll()
        const companyOptions = companies.data.map((c) => ({
          value: c._id,
          label: c.companyName
        }))
        //Fetch branches
        const branches = await branchApi.getAll()
        const branchOptions = branches.data.map((b) => ({
          value: b._id,
          label: b.branchName
        }))
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
  const handleSubmit = async (data) => {
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
      variant: "secondary"
    },
    {
      label: "Cancel",
      action: () => alert("Form cancelled!"),
      variant: "danger"
    }
  ]
  if (loading) return <p>Loading form...</p>
  return (
    <div className="flex justify-center items-center w-screen">
      <DynamicForm
        fields={fields}
        onSubmit={handleSubmit}
        buttons={customButtons}
        schema={UserSchema}
      />
    </div>
  )
}
export default UserMaster
