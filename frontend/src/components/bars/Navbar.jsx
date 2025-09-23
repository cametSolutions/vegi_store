import { useState } from "react";
import { Leaf, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  
  const menuItems = [
    {
      label: "Master",
      path: "/price-level",
      hasDropdown: true,
      dropdownItems: [
        { label: "Price Level", path: "/price-level" },
        { label: "Unit Master", path: "/unit-master" },
        { label: "Data Backup", path: "/data-backup" },
      ],
    },
    { label: "Rate Setting", path: "/rate-setting" },
    { label: "Stock Adjustment", path: "/stock-adjustment" },
    { label: "Item Master", path: "/master/item-master" },
    { label: "Account Master", path: "/admin/masters/accountMaster" },
    { label: "Purchase Return", path: "/purchase-return" },
    { label: "Purchase", path: "/purchase" },
    { label: "Receipt", path: "/receipt" },
    { label: "Sales", path: "/sales" },
  ];

  const handleNavClick = (path) => {
    console.log(`Navigating to: ${path}`);
    // Replace with your router navigation logic
  };

  const NavLink = ({ item }) => {
    if (item.hasDropdown) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center px-3 py-2 text-sm font-medium hover:bg-gray-700 rounded-md transition-colors duration-200 whitespace-nowrap focus:outline-none group">
            {item.label}
            <ChevronDown 
              className="ml-1 h-4 w-4 mt-0.5 transition-transform duration-200 group-data-[state=open]:rotate-180"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="start"
            className="bg-white border border-gray-200 shadow-lg"
          >
            {item.dropdownItems?.map((dropdownItem) => (
              <DropdownMenuItem
                key={dropdownItem.label}
                onClick={() => handleNavClick(dropdownItem.path)}
                className="cursor-pointer text-gray-700 hover:bg-gray-100 focus:bg-gray-100"
              >
                {dropdownItem.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <button
        onClick={() => handleNavClick(item.path)}
        className="flex items-center px-3 py-2 text-[13px] font-medium hover:bg-gray-700 rounded-md transition-colors duration-200 whitespace-nowrap "
      >
        {item.label}
      </button>
    );
  };

  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className=" mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Leaf className="text-emerald-500" size={24} />
            <span className="text-lg font-bold">VeggieShop</span>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            {menuItems.map((item) => (
              <NavLink key={item.label} item={item} />
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;