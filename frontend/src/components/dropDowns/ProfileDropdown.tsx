import { useState,useEffect,useRef } from "react"
import { Link } from "react-router-dom"
import { VscAccount } from "react-icons/vsc"

import {
  ChevronDown,
  LogOut,
  User,
  Building2,
  GitBranch,
  Settings
} from "lucide-react"

const ProfileDropdown = () => {
  const [open, setOpen] = useState(false)
  const [showMaster, setShowMaster] = useState(false)
const dropdownRef=useRef<HTMLDivElement>(null)
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
        setShowMaster(false) // also close Master submenu
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])
  return (
    <div className="relative ml-6" ref={dropdownRef}>
      {/* Profile Icon */}
      <button
        className="flex items-center space-x-2 border border-gray-100 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-full transition focus:outline-none"
        onClick={() => setOpen(!open)}
      >
        <VscAccount className="w-6 h-6 text-gray-600 " />
        {/* <span className="text-gray-700 font-medium ">Profile</span> */}

        <ChevronDown
          className={`h-4 w-4   text-black transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-gray-800 shadow-lg rounded-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-medium text-white">John Doe</p>
            <p className="text-xs text-white">john.doe@example.com</p>
          </div>
          <Link
            to="/switch-company"
            className="flex items-center px-4 py-2  hover:bg-gray-500 text-white"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Switch Company
          </Link>

          <Link
            to="/switch-branch"
            className="flex items-center px-4 py-2 text-white hover:bg-gray-500"
          >
            <GitBranch className="w-4 h-4 mr-2" />
            Switch Branch
          </Link>
          <Link
            to="/profile"
            className="flex items-center px-4 py-2 text-white hover:bg-gray-500"
          >
            <User className="w-4 h-4 mr-2" />
            Personal Info
          </Link>
          <Link
            to="/settings"
            className="flex items-center px-4 py-2 text-white hover:bg-gray-500"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Link>
          {/* Master Dropdown */}
          <div>
            <button
              onClick={() => setShowMaster(!showMaster)}
              className="flex items-center justify-between w-full px-4 py-2 text-white hover:bg-gray-500 focus:outline-none"
            >
              <span>Master</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  showMaster ? "rotate-180" : ""
                }`}
              />
            </button>

            {showMaster && (
              <div className="ml-6 mt-1">
                <Link
                  to="/masters/company"
                  className="block px-4 py-2 text-white hover:bg-gray-500"
                >
                  Company Master
                </Link>
                <Link
                  to="/masters/branch"
                  className="block px-4 py-2 text-white hover:bg-gray-500"
                >
                  Branch Master
                </Link>
                <Link
                  to="/masters/user"
                  className="block px-4 py-2 text-white hover:bg-gray-100"
                >
                  User Master
                </Link>
              </div>
            )}
          </div>
          <button
            onClick={() => console.log("Logout")}
            className="flex items-center w-full px-4 py-2 text-white hover:bg-gray-500"
          >
            <LogOut className="w-4 h-4 mr-2 text-red-500" />
            Logout
          </button>
        </div>
      )}
    </div>
  )
}

export default ProfileDropdown
