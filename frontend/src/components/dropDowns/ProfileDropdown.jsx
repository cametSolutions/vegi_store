import { useState, useEffect, useCallback, useMemo } from "react";
import {
  User,
  Building2,
  GitBranch,
  Settings,
  Database,
  Power,
  RefreshCcw,
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
import { userApi } from "../../api/services/user.service";
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
import { useAuth } from "@/hooks/queries/auth.queries";
import { userQueries } from "@/hooks/queries/user.queries";
import RunRevaluation from "../Revaluation/RunRevaluation";

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
          {truncate(selectedCompany?.companyName, 15) || "None Selected"}
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
    {selectedCompany?._id === companyAccess?.company?._id && (
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

  // Get Redux values (source of truth)
  const selectedCompanyFromStore = useSelector(
    (state) => state.companyBranch?.selectedCompany
  );
  const selectedBranchFromStore = useSelector(
    (state) => state.companyBranch?.selectedBranch
  );

  // Local state synced with Redux
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);

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
    ...userQueries.getUserById(
      userData?._id,
      userData?.companyId,
      userData?.branchId
    ),
    enabled: !!userData?._id,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    throwOnError: false,
  });

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
  }, [loggedUser?.email, loggedUser?.name]);

  // Handle loading states
  useEffect(() => {
    if (isLoading || authLoading) {
      dispatch(showLoader());
    } else {
      dispatch(hideLoader());
    }
  }, [isLoading, authLoading, dispatch]);

  // Handle error states
  useEffect(() => {
    if (isError) {
      console.error("User fetch error:", error);
      toast.error("Failed to fetch user details. Please try again.");
    }
  }, [isError, error]);

  // Initialize Redux store from localStorage ONLY if Redux is empty
  useEffect(() => {
    if (loggedUser && !isLoading && !isError) {
      const storedCompany = getLocalStorageItem("selectedCompany");
      const storedBranch = getLocalStorageItem("selectedBranch");
      const storedBranches = getLocalStorageItem("companyBranches");

      // Only initialize Redux if it's empty
      if (!selectedCompanyFromStore && storedCompany) {
        dispatch(SetSelectedCompanyInStore(storedCompany));
      }

      if (!selectedBranchFromStore && storedBranch) {
        dispatch(SetSelectedBranchInStore(storedBranch));
      }

      if (storedBranches) {
        dispatch(setBranchesInStore(storedBranches));
      }

      // If no stored data exists, set defaults from API
      if (
        !storedCompany &&
        !selectedCompanyFromStore &&
        loggedUser.access?.[0]
      ) {
        const { company, branches } = loggedUser.access[0];

        if (company) {
          dispatch(SetSelectedCompanyInStore(company));
          setLocalStorageItem("selectedCompany", company);
        }

        if (branches && branches.length > 0) {
          dispatch(SetSelectedBranchInStore(branches[0]));
          setLocalStorageItem("selectedBranch", branches[0]);
          dispatch(setBranchesInStore(branches));
          setLocalStorageItem("companyBranches", branches);
        }
      }
    }
  }, [
    loggedUser,
    isLoading,
    isError,
    dispatch,
    selectedCompanyFromStore,
    selectedBranchFromStore,
  ]);

  // Sync local state with Redux (Redux is source of truth)
  useEffect(() => {
    if (selectedCompanyFromStore) {
      setSelectedCompany(selectedCompanyFromStore);
    }
  }, [selectedCompanyFromStore]);

  useEffect(() => {
    if (selectedBranchFromStore) {
      setSelectedBranch(selectedBranchFromStore);
    }
  }, [selectedBranchFromStore]);

  // Memoized event handlers
  const handleLogOut = useCallback(() => {
    logout();
  }, [logout]);

  const handleSelectCompany = useCallback(
    (companyAccess) => {
      dispatch(showLoader());

      const { branches, company } = companyAccess;

      // Update Redux (source of truth)
      if (company) {
        dispatch(SetSelectedCompanyInStore(company));
        setLocalStorageItem("selectedCompany", company);
      }

      if (branches && branches.length > 0) {
        dispatch(setBranchesInStore(branches));
        setLocalStorageItem("companyBranches", branches);
        dispatch(SetSelectedBranchInStore(branches[0]));
        setLocalStorageItem("selectedBranch", branches[0]);
      } else {
        dispatch(SetSelectedBranchInStore(null));
        setLocalStorageItem("selectedBranch", null);
      }

      navigate("/");

      setTimeout(() => {
        dispatch(hideLoader());
      }, 1000);
    },
    [dispatch, navigate]
  );

  const handleSelectBranch = useCallback(
    (branch) => {
      dispatch(showLoader());

      // Update Redux (source of truth)
      dispatch(SetSelectedBranchInStore(branch));
      setLocalStorageItem("selectedBranch", branch);

      navigate("/");

      setTimeout(() => {
        dispatch(hideLoader());
      }, 1000);
    },
    [dispatch, navigate]
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
          <User className="w-4 h-4" />
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
              {loggedUser?.access?.find(
                (access) => access.company._id === selectedCompany?._id
              )?.branches?.length > 0 ? (
                loggedUser.access
                  .find((access) => access.company._id === selectedCompany?._id)
                  .branches.map((branch) => (
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
              <span className="ml-2">Master Data</span>
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

          {/* <DropdownMenuItem onClick={() => handleNavigate("/settings")}>
            <RefreshCcw className="w-4 h-4 mr-2" />
            Run Revaluation
          </DropdownMenuItem> */}

          <RunRevaluation />
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
