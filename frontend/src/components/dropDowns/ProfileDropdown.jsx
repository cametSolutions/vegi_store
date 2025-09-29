import { useState, useEffect, useCallback, useMemo } from "react";
import {
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
import { userApi } from "../../api/userApi";
import { useDispatch, useSelector } from "react-redux";
import {
  getLocalStorageItem,
  setLocalStorageItem,
} from "@/helper/localstorage";
import { truncate } from "../../../../shared/utils/string";
import { useNavigate } from "react-router-dom";
import { showLoader, hideLoader } from "@/store/slices/loaderSlice";
import { toast } from "sonner";
import {
  setBranchesInStore,
  SetSelectedBranchInStore,
  SetSelectedCompanyInStore,
} from "@/store/slices/companyBranchSlice";
import { useAuth } from "@/hooks/useAuth";

// Memoized components for better performance
const UserInfoSection = ({ user, initials, displayName }) => (
  <div className="px-4 py-3 bg-gradient-to-r from-primary/10 to-primary/5">
    <div className="flex items-center gap-3">
      <Avatar className="w-10 h-10">
        <AvatarFallback className="bg-primary text-primary-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{displayName}</p>
        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        <Badge variant="secondary" className="mt-2 text-xs rounded-xs">
          {user?.role}
        </Badge>
      </div>
    </div>
  </div>
);

const CurrentSelection = ({ selectedCompany, selectedBranch }) => (
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
);

const CompanyMenuItem = ({ companyAccess, selectedCompany, onSelect }) => (
  <DropdownMenuItem
    key={companyAccess._id}
    onClick={() => onSelect(companyAccess)}
    className="cursor-pointer"
  >
    <Building2 className="w-4 h-4 mr-2 opacity-50" />
    <span className="truncate">{companyAccess?.company?.companyName}</span>
    {selectedCompany?._id === companyAccess?._id && (
      <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
    )}
  </DropdownMenuItem>
);

const BranchMenuItem = ({ branch, selectedBranch, onSelect }) => (
  <DropdownMenuItem
    key={branch._id}
    onClick={() => onSelect(branch)}
    className="cursor-pointer"
  >
    <GitBranch className="w-4 h-4 mr-2 opacity-50" />
    <span className="truncate">{branch.branchName}</span>
    {selectedBranch?._id === branch._id && (
      <div className="ml-auto w-2 h-2 bg-primary rounded-full" />
    )}
  </DropdownMenuItem>
);

const ProfileDropdown = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Memoized selectors to prevent unnecessary re-renders
  const selectedCompanyFromStore = useSelector(
    (state) => state.companyBranch?.selectedCompany
  );
  const selectedBranchFromStore = useSelector(
    (state) => state.companyBranch?.selectedBranch
  );

  // Get user data once and memoize
  const userData = useMemo(() => getLocalStorageItem("user"), []);
  const { isLoading: authLoading, logout } = useAuth();

  // Optimized React Query configuration
  const {
    data: apiResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["users", userData?._id],
    queryFn: () => userApi.getById(userData?._id),
    enabled: !!userData?._id, // Only fetch if we have a user ID
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    gcTime: 1000 * 60 * 15, // Keep in cache for 15 minutes (replaces cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    retry: 2, // Slightly more retries for network issues
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    throwOnError: false,
  });

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);

  // Memoized user data processing
  const loggedUser = useMemo(
    () => apiResponse?.data || null,
    [apiResponse?.data]
  );

  // Memoized user utilities
  const { initials, displayName } = useMemo(() => {
    if (!loggedUser?.email) return { initials: "U", displayName: "User" };

    const name = loggedUser?.name || "User";
    return {
      initials: name?.substring(0, 2).toUpperCase(),
      displayName: name,
    };
  }, [loggedUser?.email]);

  // Handle loading states
  useEffect(() => {
    if (isLoading || authLoading ) {
      dispatch(showLoader());
    } else {
      dispatch(hideLoader());
    }
  }, [isLoading, dispatch]);

  ///




  useEffect(() => {
    if (loggedUser && !isLoading && !isError && !selectedCompanyFromStore) {
      const { company, branches } = loggedUser.access[0];

      if (company) {
        dispatch(SetSelectedCompanyInStore(company));
        setLocalStorageItem("selectedCompany", company);
      }
      if (branches && branches.length > 0 && !selectedBranchFromStore) {
        dispatch(SetSelectedBranchInStore(branches[0]));
        setLocalStorageItem("selectedBranch", branches[0]);
        dispatch(setBranchesInStore(branches));
        setLocalStorageItem("companyBranches", branches);
      }
    }
  }, [loggedUser]);

  // Handle error states
  useEffect(() => {
    if (isError) {
      console.error("User fetch error:", error);
      toast.error("Failed to fetch user details. Please try again.");
    }
  }, [isError, error]);

  // Initialize company and branch selection
  useEffect(() => {
    if (loggedUser?.access?.length > 0) {
      const firstCompanyAccess = loggedUser.access[0];
      setSelectedCompany(firstCompanyAccess);

      if (firstCompanyAccess.branches?.length > 0) {
        setSelectedBranch(firstCompanyAccess.branches[0]);
      }
    }
  }, [loggedUser?.access]);

  // Update branch when company changes
  useEffect(() => {
    if (selectedCompany?.branches?.length > 0) {
      setSelectedBranch(selectedCompany.branches[0]);
    } else {
      setSelectedBranch(null);
    }
  }, [selectedCompany]);

  // Memoized event handlers
  const handleLogOut = useCallback(() => {
    logout();
  }, []);

  const handleSelectCompany = useCallback(
    (companyAccess) => {
      setSelectedCompany(companyAccess);

      dispatch(showLoader());

      const { branches, company } = companyAccess;
      if (branches && branches.length > 0) {
        dispatch(setBranchesInStore(branches));
        setLocalStorageItem("companyBranches", branches);
      } else {
        setSelectedBranch(null);
        dispatch(SetSelectedBranchInStore(null));
      }

      if (company) {
        dispatch(SetSelectedCompanyInStore(company));
        setLocalStorageItem("selectedCompany", company);
      } else {
        dispatch(SetSelectedCompanyInStore(null));
      }

      dispatch(SetSelectedBranchInStore(branches[0] || null));
      setLocalStorageItem("selectedBranch", branches[0] || null);
      navigate("/");

      // ✅ mimic delay before hiding loader
      setTimeout(() => {
        dispatch(hideLoader());
      }, 1000);
    },
    [dispatch, setSelectedCompany]
  );

  const handleSelectBranch = useCallback(
    (branch) => {
      dispatch(showLoader());
      setSelectedBranch(branch);
      dispatch(SetSelectedBranchInStore(branch));
      setLocalStorageItem("selectedBranch", branch);
      navigate("/");

      // ✅ mimic delay before hiding loader
      setTimeout(() => {
        dispatch(hideLoader());
      }, 1000);
    },
    [dispatch, setSelectedBranch]
  );

  const handleNavigate = useCallback(
    (path) => {
      navigate(path);
    },
    [navigate]
  );

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  // Navigation items configuration
  const masterMenuItems = useMemo(
    () => [
      { path: "/masters/company", label: "Company Master", icon: Building2 },
      { path: "/masters/branch", label: "Branch Master", icon: GitBranch },
      { path: "/masters/user", label: "User Master", icon: User },
    ],
    []
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="ml-6">
        <Button variant="outline" size="sm" disabled className="text-black">
          <User className="w-4 h-4" />
          Loading...
        </Button>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="ml-6">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRetry}
          className="text-destructive hover:text-destructive-foreground"
        >
          <User className="w-4 h-4 " />
          Retry
        </Button>
      </div>
    );
  }

  // No user data
  if (!loggedUser) {
    return (
      <div className="ml-6">
        <Button variant="outline" size="sm" disabled>
          <User className="w-4 h-4" />
          No User
        </Button>
      </div>
    );
  }

  return (
    <div className="">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="relative p-0 rounded-full w-10 h-10 flex items-center justify-center border-2 border-primary hover:border-accent transition-colors"
            aria-label={`User menu for ${displayName}`}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary text-primary-foreground">
              {initials}
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-80 p-0" align="end" sideOffset={8}>
          {/* User Info Section */}
          <UserInfoSection
            user={loggedUser}
            initials={initials}
            displayName={displayName}
          />

          <DropdownMenuSeparator />

          {/* Current Selection Info */}
          <CurrentSelection
            selectedCompany={selectedCompany}
            selectedBranch={selectedBranch}
          />

          <DropdownMenuSeparator />

          {/* Switch Company */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Switch Company
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-56">
              {loggedUser?.access?.length > 0 ? (
                loggedUser.access.map((companyAccess) => (
                  <CompanyMenuItem
                    key={companyAccess._id}
                    companyAccess={companyAccess}
                    selectedCompany={selectedCompany}
                    onSelect={handleSelectCompany}
                  />
                ))
              ) : (
                <DropdownMenuItem disabled>
                  No companies available
                </DropdownMenuItem>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* Switch Branch */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Switch Branch
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-56">
              {selectedCompany?.branches?.length > 0 ? (
                selectedCompany.branches.map((branch) => (
                  <BranchMenuItem
                    key={branch._id}
                    branch={branch}
                    selectedBranch={selectedBranch}
                    onSelect={handleSelectBranch}
                  />
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
              {masterMenuItems.map(({ path, label, icon: Icon }) => (
                <DropdownMenuItem
                  key={path}
                  onClick={() => handleNavigate(path)}
                >
                  <Icon className="w-4 h-4 mr-2 opacity-50" />
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          {/* Logout */}
          <DropdownMenuItem
            onClick={handleLogOut}
            className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer font-bold"
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
