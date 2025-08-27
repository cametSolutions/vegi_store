import React, { useState } from "react"
import { MasterTable } from "../../components/table/MasterTable"
import { FaUserPlus } from "react-icons/fa"
import { Link } from "react-router-dom"
// import { Button } from "@/components/ui/button"

interface Company {
  id: string
  companyName: string
  branchName: string
  location: string
}

const CompanyMaster: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([
    {
      id: "1",
      companyName: "Tech Solutions",
      branchName: "Main",
      location: "New York"
    },
    {
      id: "2",
      companyName: "Code Factory",
      branchName: "West",
      location: "San Francisco"
    }
  ])

  const headers = ["Company Name", "Branch Name", "Location"]

  const handleEdit = (item: Company) => {
    alert(`Edit: ${item.companyName}`)
  }

  const handleDelete = (item: Company) => {
    if (
      window.confirm(`Are you sure you want to delete ${item.companyName}?`)
    ) {
      setCompanies(companies.filter((c) => c.id !== item.id))
    }
  }

  return (
    <div className="p-6 w-screen">
      <h1 className="text-2xl font-bold mb-4">Company Master</h1>
      <Link
        to="/admin/masters/companyRegistration"
        className="hover:bg-gray-100 text-black font-bold py-2 px-2 rounded inline-flex items-center"
      >
        <FaUserPlus className="mr-2" />
      </Link>
      <Button>Click me</Button>
      <MasterTable
        headers={headers}
        data={companies}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}

export default CompanyMaster
