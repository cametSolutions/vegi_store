import React from "react"
// import { useLocation } from "react-router-dom"
import Navbar from "../bars/Navbar"
// interface NavItem {
//   label: string
//   path: string
//   hasDropdown?: boolean
//   dropdownItems?: { label: string; path: string }[]
// }

const Header: React.FC = () => {
  // const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  // const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  // const location = useLocation()

  // const navigationItems: NavItem[] = [
  //   {
  //     label: "Masters",
  //     path: "/item-master",
  //     hasDropdown: true,
  //     dropdownItems: [
  //       { label: "Item Master", path: "/item-master" },
  //       { label: "Account Master", path: "/account-master" },
  //       { label: "Unit Master", path: "/unit-master" },
  //       { label: "Price Level", path: "/price-level" }
  //     ]
  //   },
  //   // {
  //   //   label: "Item Master",
  //   //   path: "/item-master",
  //   //   hasDropdown: false,
  //   //   dropdownItems: [
  //   //     { label: "Add Item", path: "/item-master/add" },
  //   //     { label: "View Items", path: "/item-master/view" },
  //   //     { label: "Categories", path: "/item-master/categories" },
  //   //     { label: "Stock Report", path: "/item-master/stock-report" }
  //   //   ]
  //   // },
  //   // { label: "Price Level", path: "/price-level" },
  //   // { label: "Unit Master", path: "/unit-master" },
  //   { label: "Rate Setting", path: "/rate-setting" },
  //   { label: "Stock Adjustment", path: "/stock-adjustment" },
  //   { label: "Purchase Return", path: "/purchase-return" },
  //   { label: "Data Backup", path: "/data-backup" },

  //   // {
  //   //   label: "Account Master",
  //   //   path: "/account-master",
  //   //   hasDropdown: false,
  //   //   dropdownItems: [
  //   //     { label: "Add Account", path: "/account-master/add" },
  //   //     { label: "View Accounts", path: "/account-master/view" },
  //   //     { label: "Account Types", path: "/account-master/types" },
  //   //     { label: "Ledger", path: "/account-master/ledger" }
  //   //   ]
  //   // },
  //   {
  //     label: "Purchase",
  //     path: "/purchase",
  //     hasDropdown: false,
  //     dropdownItems: [
  //       { label: "New Purchase", path: "/purchase/new" },
  //       { label: "Purchase History", path: "/purchase/history" },
  //       { label: "Purchase Orders", path: "/purchase/orders" },
  //       { label: "Supplier Payments", path: "/purchase/payments" }
  //     ]
  //   },
  //   {
  //     label: "Receipt",
  //     path: "/receipt",
  //     hasDropdown: false,
  //     dropdownItems: [
  //       { label: "New Receipt", path: "/receipt/new" },
  //       { label: "Receipt History", path: "/receipt/history" },
  //       { label: "Payment Receipts", path: "/receipt/payments" },
  //       { label: "Outstanding", path: "/receipt/outstanding" }
  //     ]
  //   },
  //   {
  //     label: "Sales",
  //     path: "/sales",
  //     hasDropdown: false,
  //     dropdownItems: [
  //       { label: "New Sale", path: "/sales/new" },
  //       { label: "Sales History", path: "/sales/history" },
  //       { label: "Sales Reports", path: "/sales/reports" },
  //       { label: "Customer Payments", path: "/sales/payments" }
  //     ]
  //   }
  // ]

  // const toggleMobileMenu = () => {
  //   setIsMobileMenuOpen(!isMobileMenuOpen)
  //   setActiveDropdown(null)
  // }

  // const handleDropdownToggle = (label: string) => {
  //   setActiveDropdown(activeDropdown === label ? null : label)
  // }

  // const isActiveRoute = (path: string) => {
  //   return location.pathname.startsWith(path)
  // }

  // const closeMobileMenu = () => {
  //   setIsMobileMenuOpen(false)
  //   setActiveDropdown(null)
  // }

  return (
    <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50 w-screen">
        <Navbar />
      {/* {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
          </div>
        </div>
      )} */}
    </header>
  )
}

export default Header
