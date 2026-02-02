import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ChevronDown,
  // Existing Icons
  ArrowLeftRight,
  Tags,
  Layers,
  // Specific Icons
  History,      // For Transaction Log
  Users,        // For Account Statement
  Calculator,   // For Account Summary
  AlertCircle,  // For Outstanding
  TrendingUp,   // For Sales Analysis
  Boxes,        // For Stock Register
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import ProfileDropdown from "../dropDowns/ProfileDropdown";
import logoName from "../../../public/images/Logo/logoName.png";
import logIcon from "../../../public/images/Logo/logoIcon.png";
import { clearAllFilters } from "@/store/slices/filtersSlice";

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const transactionDataFromStore = useSelector((state) => state.transaction);

  // Define menu items
  const menuItems = [
    { label: "Account Master", path: "/master/account-master" },
    { label: "Item Master", path: "/master/item-master" },
    { label: "Rate Setting", path: "/master/rate-setting" },
    
    // Transactions
    { label: "Purchase", path: "/transactions/purchase/create" },
    { label: "Purchase Return", path: "/transactions/purchase_return/create" },
    { label: "Sales", path: "/transactions/sale/create" },
    { label: "Sales Return", path: "/transactions/sales_return/create" },
    { label: "Receipt", path: "/transactions/receipt/create" },
    { label: "Payment", path: "/transactions/payment/create" },

    // Reports Dropdown
    {
      label: "Reports",
      path: "#",
      hasDropdown: true,
      dropdownItems: [
        // Group 1: Accounts & Finance
        {
          heading: "Accounts & Finance",
          items: [
            {
              label: "Account Statement",
              path: "/reports/account-statement",
              icon: Users,
            },
            {
              label: "Account Summary",
              path: "/reports/account-summary",
              icon: Calculator,
            },
            {
              label: "Transaction Log",
              path: "/reports/transaction-summary",
              icon: History, // Added here alongside accounts
            },
            {
              label: "Outstanding Report",
              path: "/reports/outstanding-summary",
              icon: AlertCircle,
            },
          ]
        },
        // Group 2: Inventory
        {
          heading: "Inventory",
          items: [
             {
              label: "Item Analytics",
              path: "/reports/items-summary",
              icon: TrendingUp,
            },
            {
              label: "Stock Register",
              path: "/reports/stock-register",
              icon: Boxes,
            },
          ]
        }
      ],
    },
    {
      label: "Extras",
      path: "#",
      hasDropdown: true,
      dropdownItems: [
        {
           heading: null, 
           items: [
            {
              label: "Stock Adjustment",
              path: "transactions/stock_adjustment/create",
              icon: ArrowLeftRight,
            },
            {
              label: "Price Level",
              path: "/master/price-level",
              icon: Tags,
            },
           ]
        }
      ],
    },
  ];

  const handleNavClick = (path) => {
    if (transactionDataFromStore.isEditMode) {
      const confirmLeave = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );
      if (!confirmLeave) return;
    }
    dispatch(clearAllFilters());
    navigate(path);
  };

  const NavLink = ({ item }) => {
    // 1. Dropdown Item Render
    if (item.hasDropdown) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center px-3 py-2 text-[13px] font-medium text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-md transition-all duration-200 focus:outline-none group data-[state=open]:bg-gray-700 data-[state=open]:text-white">
            {item.label}
            <ChevronDown className="ml-1.5 h-3.5 w-3.5 text-gray-400 group-hover:text-white transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            sideOffset={8}
            className="w-60 bg-white border border-slate-200 shadow-xl rounded-lg p-1.5"
          >
            {item.dropdownItems?.map((group, groupIndex) => (
              <React.Fragment key={groupIndex}>
                {/* Render Heading if it exists */}
                {group.heading && (
                  <DropdownMenuLabel className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2 py-1.5 mt-1">
                    {group.heading}
                  </DropdownMenuLabel>
                )}

                {/* Render Items in this group */}
                {group.items.map((subItem) => {
                  const Icon = subItem.icon || Layers;
                  return (
                    <DropdownMenuItem
                      key={subItem.label}
                      onClick={() => handleNavClick(subItem.path)}
                      className="flex items-center gap-3 cursor-pointer px-3 py-2.5 text-sm text-slate-700 rounded-md hover:bg-slate-50 focus:bg-slate-50 focus:text-slate-900 transition-colors"
                    >
                      <div className="p-1.5 bg-slate-100 rounded text-slate-500 group-hover:text-blue-600">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium">{subItem.label}</span>
                    </DropdownMenuItem>
                  );
                })}
                
                {/* Add Separator between groups (but not after last one) */}
                {groupIndex < item.dropdownItems.length - 1 && (
                  <DropdownMenuSeparator className="my-1 bg-slate-100" />
                )}
              </React.Fragment>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    // 2. Standard Link Render
    return (
      <button
        onClick={() => handleNavClick(item.path)}
        className="flex items-center px-3 py-2 text-[13px] font-medium text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-md transition-colors duration-200 whitespace-nowrap"
      >
        {item.label}
      </button>
    );
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-800 shadow-lg sticky top-0 z-50 py-1">
      <div className="mx-auto px-4 sm:px-6 lg:px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo Section */}
          <div
            onClick={() => handleNavClick("/")}
            className="flex items-center gap-1 cursor-pointer select-none"
          >
            <div className="bg-white/10 p-1 rounded-lg">
              <img src={logIcon} alt="Logo" className="h-7 w-7" />
            </div>
            <img
              src={logoName}
              alt="Logo Name"
              className="h-28 w-28 mt-2 object-contain ml-[-5px] opacity-90 hover:opacity-100 transition-opacity"
            />
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => (
              <NavLink key={item.label} item={item} />
            ))}

            {/* Divider */}
            <div className="h-6 w-px bg-gray-700 mx-2" />

            <ProfileDropdown />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
