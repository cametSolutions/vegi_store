import { useState } from "react";
import { Link } from "react-router-dom";
import ProfileDropdown from "../dropDowns/ProfileDropdown";
import {
  ChevronDown,
  Phone,
  Mail,
  Menu,
  X,
  Facebook,
  Twitter,
  Youtube,
  Leaf,
} from "lucide-react";

import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [isMastersOpen, setIsMastersOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState("");
  const menuItems = [
    {
      label: "Rate Setting",
      path: "/rate-setting",
    },
    {
      label: "Stock Adjustment",
      path: "/stock-adjustment",
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
          path: "/price-level",
        },

        { label: "Unit Master", path: "/unit-master" },
        { label: "Data Backup", path: "/data-backup" },
      ],
    },
  ];

  const masterItems = ["Item Master", "Account Master", "Unit Master"];
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setActiveDropdown("");
  };

  return (
    <div className="w-full">
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
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
