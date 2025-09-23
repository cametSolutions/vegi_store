import  { useState } from "react"
import { MasterTable } from "../../components/table/MasterTable"
import { FaUserPlus } from "react-icons/fa"
import { Link } from "react-router-dom"

const BranchList= () => {
  const [branches, setBranches] = useState([
    {
      id: "1",
      branchName: "camet",
      companyName: "Camet",

      location: "New York"
    },
    {
      id: "2",
      branchName: "Accuanet",
      companyName: "Camet",

      location: "San Francisco"
    }
  ])
  const headers = ["Branch Name", "Company Name", "Location"]

  const handleEdit = (item) => {
    alert(`Edit: ${item.branchName}`)
  }

  const handleDelete = (item) => {
    if (window.confirm(`Are you sure you want to delete ${item.branchName}?`)) {
      setBranches(branches.filter((c) => c.id !== item.id))
    }
  }
  return (
    <div className="p-6 w-screen">
      <h1 className="text-2xl font-bold mb-4">Branch Master</h1>
      <Link
        to="/admin/masters/branchRegistration"
        className="hover:bg-gray-100 text-black font-bold py-2 px-2 rounded inline-flex items-center"
      >
        <FaUserPlus className="mr-2" />
      </Link>
      {/* <Button>Click me</Button> */}
      <MasterTable
        headers={headers}
        data={branches}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}
export default BranchList
