import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { VscAccount } from "react-icons/vsc"
import {
  getLocalStorageItem,
  setLocalStorageItem
} from "../../helper/localstorage"
import {
  ChevronDown,
  LogOut,
  User,
  Building2,
  GitBranch,
  Settings
} from "lucide-react"
import { AppDispatch } from "@/store/store"
import { useDispatch } from "react-redux"
import {
  selectedBranch as setseletedBranch,
  selectedCompany as setSelectedCompany
} from "../../store/slices/companyBranchSlice.js"
const ProfileDropdown = () => {
  const [open, setOpen] = useState(false)
  const [selectedCompany, setselectedCompany] = useState<string | null>(null)
  const [selectedBranch, setselectedBranch] = useState<string | null>(null)
  const [showCompanies, setShowCompanies] = useState(false)
  const [showBranches, setShowBranches] = useState(false)
  const [loggedUser, setloggedUser] = useState<string | null>(null)
  const [showMaster, setShowMaster] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  useEffect(() => {
    const selectedcompany = getLocalStorageItem<string>("selectedCompany")
    const user = getLocalStorageItem<string>("user")
    setloggedUser(user)
    const selectedbranch = getLocalStorageItem<string>("selectedBranch")

    setselectedCompany(selectedcompany)
    setselectedBranch(selectedbranch)
  }, [])

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
  const handleLogOut = () => {
    localStorage.clear()
    navigate("/login")
    // console.log("keysssssssssssss", Object.keys(localStorage))
  }

  const handleSelectCompany = (company: {
    _id: string
    companyName: string
  }) => {
    dispatch(setSelectedCompany(company))
    // setselectedCompany(company.name)
    setLocalStorageItem("selectedCompany", company)
    setShowCompanies(false)
  }

  const handleSelectBranch = (branch: { _id: string; branchName: string }) => {
    dispatch(setseletedBranch(branch))
    // setseletedBranch(branch.name)
    setLocalStorageItem("selectedBranch", branch)
    setselectedBranch(branch)
    setShowBranches(false)
  }
  // console.log(loggedUser)
  return (
    <div className="relative ml-6 cursor-pointer" ref={dropdownRef}>
      {/* Profile Icon */}
      <button
        className="flex items-center space-x-2 border border-gray-100 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-full transition focus:outline-none"
        onClick={() => setOpen(!open)}
      >
        <VscAccount className="w-6 h-6 text-gray-600 " />
        {/* <span className="text-gray-700 font-medium ">Profile</span> */}

        <ChevronDown
          className={`h-4 w-4   text-black transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-gray-800 shadow-lg rounded-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-medium text-white">{loggedUser.name}</p>
            <p className="text-xs text-white">{loggedUser.email}</p>
          </div>
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-xs uppercase text-gray-400">Logged In Details</p>
            <div className="mt-2">
              <p className="text-sm text-white">
                <span className="font-semibold">Company:</span>{" "}
                {selectedCompany?.companyName || "Not Selected"}
              </p>
              <p className="text-sm text-white">
                <span className="font-semibold">Branch:</span>{" "}
                {selectedBranch?.branchName || "Not Selected"}
              </p>
            </div>
          </div>

          {/* Switch Company Section */}
          <div>
            <button
              onClick={() => {
                setShowCompanies(!showCompanies)
                setShowBranches(false)
              }}
              className="flex items-center justify-between w-full px-4 py-2 text-white hover:bg-gray-500"
            >
              <span>
                <Building2 className="inline w-4 h-4 mr-2" />
                Switch Company
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  showCompanies ? "rotate-180" : ""
                }`}
              />
            </button>

            {showCompanies && (
              <div className="ml-6 mt-1">
                {loggedUser.access.map((company) => (
                  <div
                    key={company.id}
                    onClick={() => handleSelectCompany(company)}
                    className="block px-4 py-2 text-white hover:bg-gray-500 cursor-pointer"
                  >
                    {company.company.companyName}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Switch Branch Section */}
          <div>
            <button
              onClick={() => {
                setShowBranches(!showBranches)
                setShowCompanies(false)
              }}
              className="flex items-center justify-between w-full px-4 py-2 text-white hover:bg-gray-500"
            >
              <span>
                <GitBranch className="inline w-4 h-4 mr-2" />
                Switch Branch
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  showBranches ? "rotate-180" : ""
                }`}
              />
            </button>

            {showBranches && (
              <div className="ml-6 mt-1">
                {loggedUser?.access[0]?.branches?.map((branch) => (
                  <div
                    key={branch._id}
                    onClick={() => handleSelectBranch(branch)}
                    className="block px-4 py-2 text-white hover:bg-gray-500 cursor-pointer"
                  >
                    {branch.branchName}
                  </div>
                ))}
              </div>
            )}
          </div>

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
                  className="block px-4 py-2 text-white hover:bg-gray-500"
                >
                  User Master
                </Link>
              </div>
            )}
          </div>
          <button
            onClick={() => handleLogOut()}
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
