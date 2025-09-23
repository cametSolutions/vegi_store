import { useState } from "react"
import { Link } from "react-router-dom"
import ProfileDropdown from "../dropDowns/ProfileDropdown"
import {
  ChevronDown,
  Phone,
  Mail,
  Menu,
  X,
  Facebook,
  Twitter,
  Youtube,
  Leaf
} from "lucide-react"

const Navbar = () => {
  const [isMastersOpen, setIsMastersOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState("")
  const menuItems = [
    {
      label: "Rate Setting",
      path: "/rate-setting"
    },
    {
      label: "Stock Adjustment",
      path: "/stock-adjustment"
    },
    { label: "Item Master", path: "/master/item-master" },
    { label: "Account Master", path: "/admin/masters/accountMaster" },
    { label: "Purchase Return", path: "/purchase-return" },

    { label: "Purchase", path: "/purchase" },
    { label: "Receipt", path: "/receipt" },
    { label: "Sales", path: "/sales" },
    // {label:'Price Level',path:'/price-level'},
    {
      label: "Master",
      path: "/price-level",
      hasDropdown: true,
      dropdownItems: [
        {
          label: "Price Level",
          path: "/price-level"
        },

        { label: "Unit Master", path: "/unit-master" },
        { label: "Data Backup", path: "/data-backup" }
      ]
    }
  ]

  const masterItems = ["Item Master", "Account Master", "Unit Master"]
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
    setActiveDropdown("")
  }

  return (
    <div className="w-full">
      {/* Top Bar */}
      <div className="bg-emerald-500 text-white px-4 py-2 text-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Phone size={16} />
              <span>+977 42647190</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail size={16} />
              <span>veggieshop@example.com</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm">Follow us:</span>
            <div className="flex space-x-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
                <Facebook size={16} />
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
                <Twitter size={16} />
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
                <Youtube size={16} />
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
                <Leaf size={16} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-gray-800 text-white shadow-lg">
        <div className="flex">
          <div className="flex items-center space-x-2 flex-shrink-0 p-3">
            <Leaf className="text-emerald-500 mr-4" size={32} />
            <span className="text-xl font-bold mr-4">VeggieShop</span>
          </div>
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}

              {/* Navigation Links - Always visible on desktop */}
              <div className="flex-1 flex justify-center">
                <div className="flex items-center space-x-4">
                  {menuItems.map((item) => (
                    <div key={item.label} className="relative group">
                      <Link
                        to={item.path}
                        className="flex items-center px-3 py-2 text-sm font-medium hover:bg-gray-700 rounded-md transition-colors duration-200 whitespace-nowrap"
                        onMouseEnter={() => setActiveDropdown(item.label)}
                        onMouseLeave={() => setActiveDropdown("")}
                      >
                        {item.label}
                        {item.hasDropdown && (
                          <ChevronDown className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:rotate-180" />
                        )}
                      </Link>
                      {item.hasDropdown && activeDropdown === item.label && (
                        <div
                          className="absolute left-0 mt-1 w-56 bg-gray-800 rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                          onMouseEnter={() => setActiveDropdown(item.label)}
                          onMouseLeave={() => setActiveDropdown("")}
                        >
                          {item.dropdownItems?.map((dropdownItem) => (
                            <Link
                              key={dropdownItem.label}
                              to={dropdownItem.path}
                              className={`block px-4 py-3 text-sm transition-colors duration-150 text-white ${
                                location.pathname === dropdownItem.path
                                  ? ""
                                  : ""
                              }`}
                            >
                              {dropdownItem.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-4 ">
                <div className="relative ml-6 ">
                  <ProfileDropdown />
                </div>
                <div className="md:hidden">
                  <button
                    onClick={toggleMobileMenu}
                    className="inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors duration-200"
                  >
                    {isMobileMenuOpen ? (
                      <X className="h-6 w-6" />
                    ) : (
                      <Menu className="h-6 w-6" />
                    )}
                  </button>
                </div>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden flex flex-col space-y-1 w-6 h-6"
              >
                <div
                  className={`w-full h-0.5 bg-white transition-all duration-300 ${
                    isMobileMenuOpen ? "rotate-45 translate-y-1.5" : ""
                  }`}
                ></div>
                <div
                  className={`w-full h-0.5 bg-white transition-all duration-300 ${
                    isMobileMenuOpen ? "opacity-0" : ""
                  }`}
                ></div>
                <div
                  className={`w-full h-0.5 bg-white transition-all duration-300 ${
                    isMobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
                  }`}
                ></div>
              </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
              <div className="md:hidden border-t border-gray-700">
                <div className="py-2 space-y-1">
                  {menuItems.map((item, index) => (
                    <button
                      key={index}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}

                  <div className="px-4 py-2 ">
                    <button
                      onClick={() => setIsMastersOpen(!isMastersOpen)}
                      className="flex items-center justify-between w-full text-sm hover:text-emerald-400 transition-colors"
                    >
                      Masters
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${
                          isMastersOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isMastersOpen && (
                      <div className="mt-2 ml-4 space-y-1">
                        {masterItems.map((item, index) => (
                          <button
                            key={index}
                            className="block w-full text-left py-1 text-sm text-gray-500 hover:text-white transition-colors"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </div>
  )
}

export default Navbar
