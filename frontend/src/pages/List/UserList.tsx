import React, { useState } from "react"
import { MasterTable } from "../../components/table/MasterTable"
import { FaUserPlus } from "react-icons/fa"
import { Link } from "react-router-dom"
interface User {
  id: string
  userName: string
  mobile: string
  address: string
  email: string
  aadhar: string
  accountNumber?: string
}
const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      userName: "abhi",
      address: "neendoor",
      mobile: "123456789",
      email: "abhi",
      aadhar: "1425"
    },
    {
      id: "2",
      userName: "midhun",
      address: "ettumanoor",
      mobile: "123456789",
      email: "midhun@gmail.com",
      aadhar: "8825"
    },
    {
      id: "3",
      userName: "sreeraj",
      address: "kottyam",
      mobile: "445416146",
      email: "sree@gmail.com",
      aadhar: "58625"
    }
  ])
const headers=["User Name","Address","Mobile","email","Aadhar"]
  const handleEdit = (item: User) => {
    alert(`Edit: ${item.userName}`)
  }

  const handleDelete = (item: User) => {
    if (window.confirm(`Are you sure you want to delete ${item.userName}?`)) {
      setUsers(users.filter((c) => c.id !== item.id))
    }
  }
  return (
    <div className="p-6 w-screen">
      <h1 className="text-2xl font-bold mb-4">User Master</h1>
      <Link
        to="/admin/masters/userRegistration"
        className="hover:bg-gray-100 text-black font-bold py-2 px-2 rounded inline-flex items-center"
      >
        <FaUserPlus className="mr-2" />
      </Link>
      {/* <Button>Click me</Button> */}
      <MasterTable
        headers={headers}
        data={users}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}
export default UserList
