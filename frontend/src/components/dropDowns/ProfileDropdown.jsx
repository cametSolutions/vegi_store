import { useState, useEffect } from "react";
import {
  ChevronDown,
  LogOut,
  User,
  Building2,
  GitBranch,
  Settings,
  Database,
  Power,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { userApi } from "../../api/userApi"; // Import your userApi
import { useSelector } from "react-redux";
import { getLocalStorageItem } from "@/helper/localstorage";
import { truncate } from "../../../../shared/utils/string";
import { useNavigate } from "react-router-dom";

const ProfileDropdown = () => {
  //// Redux Store Data
  const selectedCompanyFromStore = useSelector(
    (state) => state.companyBranch.selectedCompany
  );
  const selectedBranchFromStore = useSelector(
    (state) => state.companyBranch.selectedBranch
  );

  const navigate = useNavigate();

  /// User details from local storage
  const userData = getLocalStorageItem("user");

  // Direct query usage with comprehensive refetch prevention and debugging
  const { data: apiResponse, isLoading } = useQuery({
    queryKey: ["users", userData?._id],
    queryFn: () => {
      return userApi.getById(userData?._id);
    },
    staleTime: 1000 * 60 * 5, // cache 5 mins
    cacheTime: 1000 * 60 * 10, // keep in cache for 10 mins
    refetchOnWindowFocus: false, // don't refetch on window focus
    refetchOnMount: false, // don't refetch when component mounts if data exists
    refetchOnReconnect: false, // don't refetch on network reconnect
    refetchInterval: false, // don't refetch on interval
    refetchIntervalInBackground: false, // don't refetch in background
    // enabled: !!userData?._id, // don't fetch if no userId
    retry: 1, // reduce retry attempts
    retryOnMount: false, // don't retry when component mounts
  });

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loggedUser, setLoggedUser] = useState(null);

  useEffect(() => {
    // Handle API response structure: { message: "user found", data: {...} }
    if (apiResponse?.data) {
      const userData = apiResponse.data;
      setLoggedUser(userData);

      // Set initial selected company and branch from API data
      if (userData.access && userData.access.length > 0) {
        const firstCompanyAccess = userData.access[0];
        setSelectedCompany(firstCompanyAccess);

        // Set first branch of the first company as default
        if (
          firstCompanyAccess.branches &&
          firstCompanyAccess.branches.length > 0
        ) {
          setSelectedBranch(firstCompanyAccess.branches[0]);
        }
      }
    }
  }, [apiResponse]);

  // Update selected branch when company changes - Show only branches of selected company
  useEffect(() => {
    if (
      selectedCompany &&
      selectedCompany.branches &&
      selectedCompany.branches.length > 0
    ) {
      // Reset to first branch of newly selected company
      setSelectedBranch(selectedCompany.branches[0]);
    } else {
      setSelectedBranch(null);
    }
  }, [selectedCompany]);

  const handleLogOut = () => {
    // Clear localStorage and navigate to login
    localStorage.clear();
    // navigate("/login");
  };

  const handleSelectCompany = (companyAccess) => {
    setSelectedCompany(companyAccess);
    // You can dispatch to Redux store here if needed
    // dispatch(setSelectedCompany(companyAccess));
  };

  const handleSelectBranch = (branch) => {
    setSelectedBranch(branch);
    // You can dispatch to Redux store here if needed
    // dispatch(setSelectedBranch(branch));
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  const getUserInitials = (email) => {
    if (!email) return "U";
    const name = email.split("@")[0];
    return name.split("").slice(0, 2).join("").toUpperCase();
  };

  const getDisplayName = (email) => {
    if (!email) return "User";
    return email.split("@")[0];
  };

  // Show loading state
  if (isLoading || !loggedUser) {
    return (
      <div className="ml-6">
        <Button variant="outline" size="sm" disabled className="text-black">
          <User className="w-4 h-4  " />
          Loading...
        </Button>
      </div>
    );
  }

  // console.log("Logged User:", loggedUser);
  // console.log("Selected Company:", selectedCompany);
  // console.log("Selected Branch:", selectedBranch);

  return (
    <div className="">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="relative p-0 rounded-full w-10 h-10 flex items-center justify-center border-2 border-primary hover:border-accent transition-colors"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary text-primary-foreground">
              {getUserInitials(loggedUser.email)}
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-80 p-0" align="end" sideOffset={8}>
          {/* User Info Section */}
          <div className="px-4 py-3 bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getUserInitials(loggedUser.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {getDisplayName(loggedUser.email)}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {loggedUser.email}
                </p>
                <Badge variant="outline" className="mt-1 text-xs">
                  {loggedUser.role}
                </Badge>
              </div>
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Current Selection Info */}
          <div className="px-4 py-3 bg-muted/30">
            <DropdownMenuLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-0 pb-2">
              Current Selection
            </DropdownMenuLabel>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Company:</span>
                <Badge variant="secondary" className="max-w-[150px] truncate">
                  {truncate(selectedCompany?.company?.companyName, 15) ||
                    "None Selected"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Branch:</span>
                <Badge variant="outline" className="max-w-[150px] truncate">
                  {truncate(selectedBranch?.branchName, 15) || "None Selected"}
                </Badge>
              </div>
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Switch Company */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Switch Company
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-56">
              {loggedUser.access && loggedUser.access.length > 0 ? (
                loggedUser.access.map((companyAccess) => (
                  <DropdownMenuItem
                    key={companyAccess._id}
                    onClick={() => handleSelectCompany(companyAccess)}
                    className="cursor-pointer"
                  >
                    <Building2 className="w-4 h-4 mr-2 opacity-50" />
                    <span className="truncate">
                      {companyAccess.company.companyName}
                    </span>
                    {selectedCompany?._id === companyAccess._id && (
                      <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
                    )}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>
                  No companies available
                </DropdownMenuItem>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Switch Branch - Only shows branches of selected company */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Switch Branch
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-56">
              {selectedCompany?.branches &&
              selectedCompany.branches.length > 0 ? (
                selectedCompany.branches.map((branch) => (
                  <DropdownMenuItem
                    key={branch._id}
                    onClick={() => handleSelectBranch(branch)}
                    className="cursor-pointer"
                  >
                    <GitBranch className="w-4 h-4 mr-2 opacity-50" />
                    <span className="truncate">{branch.branchName}</span>
                    {selectedBranch?._id === branch._id && (
                      <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
                    )}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>
                  No branches available for this company
                </DropdownMenuItem>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          {/* Profile Links */}
          <DropdownMenuItem onClick={() => handleNavigate("/profile")}>
            <User className="w-4 h-4 mr-2" />
            Personal Info
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => handleNavigate("/settings")}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </DropdownMenuItem>

          {/* Master Menu */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Master Data
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-48">
              <DropdownMenuItem
                onClick={() => handleNavigate("/masters/company")}
              >
                <Building2 className="w-4 h-4 mr-2 opacity-50" />
                Company Master
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleNavigate("/masters/branch")}
              >
                <GitBranch className="w-4 h-4 mr-2 opacity-50" />
                Branch Master
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNavigate("/masters/user")}>
                <User className="w-4 h-4 mr-2 opacity-50" />
                User Master
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          {/* Logout */}
          <DropdownMenuItem
            onClick={handleLogOut}
            className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer  font-bold"
          >
            <Power className="w-4 h-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ProfileDropdown;
