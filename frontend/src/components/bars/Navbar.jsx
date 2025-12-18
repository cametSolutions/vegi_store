import { useState } from "react";
import { Leaf, ChevronDown, LogOutIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ProfileDropdown from "../dropDowns/ProfileDropdown";
import { Link, useNavigate } from "react-router-dom";
import logoName from "../../../public/images/Logo/logoName.png";
import logIcon from "../../../public/images/Logo/logoIcon.png";
import { useSelector } from "react-redux";

const Navbar = () => {
  const menuItems = [
    // {
    //   label: "Master",
    //   path: "/price-level",
    //   hasDropdown: true,
    //   dropdownItems: [
    //     { label: "Item Master", path: "/master/item-master" },
    //     { label: "Account Master", path: "/master/account-master" },

    //     // { label: "Unit Master", path: "/masters/unit-master" },
    //     // { label: "Data Backup", path: "/masters/data-backup" },
    //   ],
    // },

    { label: "Account Master", path: "/master/account-master" },
    { label: "Item Master", path: "/master/item-master" },
    { label: "Rate Setting", path: "/master/rate-setting" },

    { label: "Purchase", path: "/transactions/purchase/create" },
    { label: "Purchase Return", path: "/transactions/purchase_return/create" },
    { label: "Sales", path: "/transactions/sale/create" },
    { label: "Sales Return", path: "/transactions/sales_return/create" },
    { label: "Receipt", path: "/transactions/receipt/create" },
    { label: "Payment", path: "/transactions/payment/create" },
    {
      label: "Reports",
      path: "/transactions/payment/create",
      hasDropdown: true,
      dropdownItems: [
       
        {
          label: "Outstanding Summary",
          path: "/reports/outstanding-summary",
        },
           {
          label: "Transaction Summary",
          path: "/reports/transaction-summary",
        },
        {
          label: "Items Summary",
          path: "/reports/items-summary",
        },


      ],
    },
    {
      label: "Extras",
      path: "/price-level",
      hasDropdown: true,
      dropdownItems: [
   
        { label: "Stock Adjustment", path: "/stock-adjustment" },
        { label: "Price Level", path: "/master/price-level" },
      ],
    },
  ];

  const transactionDataFromStore = useSelector((state) => state.transaction);

  const navigate = useNavigate();

  const handleNavClick = (path) => {
    if (transactionDataFromStore.isEditMode) {
      alert(
        "Please save the current transaction before navigating to another page or cancel it"
      );
    } else {
      navigate(path);
    }
  };

  const NavLink = ({ item }) => {
    if (item.hasDropdown) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center px-3 py-2 text-sm font-medium hover:bg-gray-700 rounded-md transition-colors duration-200 whitespace-nowrap focus:outline-none group">
            {item.label}
            <ChevronDown className="ml-1 h-4 w-4 mt-0.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
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
          <div
            onClick={() => {
              handleNavClick("/");
            }}
            className="flex items-center  flex-shrink-0"
          >
            <img src={logIcon} alt="Logo" className="h-10 w-10" />
            <img
              src={logoName}
              alt="Logo"
              className="h-32 w-32 mt-2 ml-[-10px]"
            />
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1">
            {menuItems.map((item) => (
              <NavLink key={item.label} item={item} />
            ))}

            <ProfileDropdown />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
