import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Building2, 
  Lock, 
  Save,
  MapPin,
  ChevronRight,
  ShieldAlert
} from "lucide-react";
import { userQueries } from "@/hooks/queries/user.queries";
import { companyMasterQueries } from "@/hooks/queries/companyMaster.queries";
import { branchMasterQueries } from "@/hooks/queries/branchMaster.queries";
import { userMutations } from "@/hooks/mutations/user.mutations";
import { getLocalStorageItem } from "@/helper/localstorage";
import { UserAccessSchema } from "@/validation/userSchema";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const UserAccessPage = () => {
  const queryClient = useQueryClient();
  const loggedInUser = getLocalStorageItem("user");
  const userId = loggedInUser?._id;

  const selectedCompanyFromStore = useSelector(
    (state) => state.companyBranch?.selectedCompany,
  );
  const selectedBranchFromStore = useSelector(
    (state) => state.companyBranch?.selectedBranch,
  );
  const lockedCompanyId = selectedCompanyFromStore?._id || null;
  const lockedBranchId = selectedBranchFromStore?._id || null;

  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [selectedBranchesByCompany, setSelectedBranchesByCompany] = useState({});
  const [focusedCompanyId, setFocusedCompanyId] = useState(null);

  const { data: userResponse, isLoading: userLoading } = useQuery({
    ...userQueries.getUserById(userId),
  });

  const { data: companiesResponse, isLoading: companyLoading } = useQuery({
    ...companyMasterQueries.search("", 1000, {}, { enabled: !!userId }),
  });

  const { data: branchesResponse, isLoading: branchLoading } = useQuery({
    ...branchMasterQueries.search("", 2000, {}, { enabled: !!userId }),
  });

  const user = userResponse?.data;
  const companies = companiesResponse?.data || [];
  const branches = branchesResponse?.data || [];

  const branchesByCompany = useMemo(() => {
    return branches.reduce((acc, branch) => {
      const key = branch.companyId;
      if (!acc[key]) acc[key] = [];
      acc[key].push(branch);
      return acc;
    }, {});
  }, [branches]);

  // Set initial focus
  useEffect(() => {
    if (companies.length > 0 && !focusedCompanyId) {
      setFocusedCompanyId(lockedCompanyId || companies[0]._id);
    }
  }, [companies, focusedCompanyId, lockedCompanyId]);

  useEffect(() => {
    const accessList = user?.access || [];
    const companyIds = accessList
      .map((entry) => entry?.company?._id || entry?.company)
      .filter(Boolean);
    const branchMap = {};

    accessList.forEach((entry) => {
      const companyId = entry?.company?._id || entry?.company;
      if (!companyId) return;
      branchMap[companyId] = (entry?.branches || [])
        .map((branch) => branch?._id || branch)
        .filter(Boolean);
    });

    if (lockedCompanyId && !companyIds.includes(lockedCompanyId)) {
      companyIds.push(lockedCompanyId);
    }

    if (lockedCompanyId && lockedBranchId) {
      const existing = branchMap[lockedCompanyId] || [];
      branchMap[lockedCompanyId] = [...new Set([...existing, lockedBranchId])];
    }

    setSelectedCompanies([...new Set(companyIds)]);
    setSelectedBranchesByCompany(branchMap);
  }, [user, lockedCompanyId, lockedBranchId]);

  const mutation = useMutation(userMutations.updateAccess(queryClient));
  const isLoading = userLoading || companyLoading || branchLoading;

  const handleCompanyToggle = (companyId, checked) => {
    setFocusedCompanyId(companyId); // Auto-focus the company when checked/unchecked
    
    if (!checked && lockedCompanyId && companyId === lockedCompanyId) {
      toast.error("Current selected company cannot be removed");
      return;
    }

    if (checked) {
      setSelectedCompanies((prev) => [...new Set([...prev, companyId])]);
      setSelectedBranchesByCompany((prev) => ({ ...prev, [companyId]: [] }));
      return;
    }

    setSelectedCompanies((prev) => prev.filter((id) => id !== companyId));
    setSelectedBranchesByCompany((prev) => {
      const next = { ...prev };
      delete next[companyId];
      return next;
    });
  };

  const handleBranchToggle = (companyId, branchId, checked) => {
    if (
      !checked &&
      lockedCompanyId &&
      lockedBranchId &&
      companyId === lockedCompanyId &&
      branchId === lockedBranchId
    ) {
      toast.error("Current selected branch cannot be removed");
      return;
    }

    setSelectedBranchesByCompany((prev) => {
      const current = prev[companyId] || [];
      const nextBranches = checked
        ? [...new Set([...current, branchId])]
        : current.filter((id) => id !== branchId);
      return { ...prev, [companyId]: nextBranches };
    });
  };

  const handleSave = () => {
    const accessPayload = selectedCompanies.map((companyId) => ({
      company: companyId,
      branches: selectedBranchesByCompany[companyId] || [],
    }));

    const validation = UserAccessSchema.safeParse({
      userId,
      access: accessPayload,
    });

    if (!validation.success) {
      toast.error(validation.error.issues?.[0]?.message || "Invalid user access");
      return;
    }

    mutation.mutate({ userId, access: accessPayload });
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-var(--header-height))] w-full flex-col items-center justify-center space-y-4 bg-slate-50/50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        <p className="text-sm font-medium text-slate-500">Loading access data...</p>
      </div>
    );
  }

  const focusedCompany = companies.find((c) => c._id === focusedCompanyId);
  const focusedCompanyBranches = focusedCompanyId ? branchesByCompany[focusedCompanyId] || [] : [];
  const isFocusedCompanySelected = selectedCompanies.includes(focusedCompanyId);

  return (
    <div className="h-[calc(100vh-var(--header-height))] overflow-hidden bg-slate-50/50 flex flex-col">
      <div className="px-6 pt-4 pb-2 border-b border-slate-200 bg-slate-50/80 shrink-0">
        <h1 className="text-base font-semibold text-slate-900">User</h1>
        {selectedCompanyFromStore && (
          <p className="text-[11px] text-slate-500 mt-0.5">
            Company:{" "}
            <span className="font-medium text-slate-700">
              {selectedCompanyFromStore.companyName}
            </span>
          </p>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden p-4 md:p-5">
      <div className="flex h-full w-full flex-col gap-3 min-h-0">
        
        {/* Page Header */}
        <div className="flex shrink-0 flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Access Management
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure company and branch permissions for this user.
            </p>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={mutation.isPending || !userId}
            className="shadow-sm transition-all whitespace-nowrap"
          >
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) }
            Save Allocation
          </Button>
        </div>


             {/* User Details Card */}
        <Card className="shrink-0 border-slate-200 shadow-sm rounded-xl overflow-hidden bg-white">
          <CardContent className="p-3.5 sm:p-4">
            {/* Header Section */}
            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100">
               <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100 shrink-0">
                  <User className="h-4.5 w-4.5 text-indigo-600" />
               </div>
               <div className="flex flex-col">
                 <h2 className="text-sm font-bold text-slate-900">{user?.name || "User Profile"}</h2>
                 <p className="text-[11px] font-medium text-slate-500">Review identity before modifying access</p>
               </div>
            </div>
            
            {/* Info Grid Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="flex flex-col rounded-lg bg-slate-50 p-2.5 border border-slate-100 transition-colors hover:bg-slate-100/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Email Address
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-900 truncate" title={user?.email}>
                  {user?.email || "Not provided"}
                </span>
              </div>

              <div className="flex flex-col rounded-lg bg-slate-50 p-2.5 border border-slate-100 transition-colors hover:bg-slate-100/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    System Role
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-900 truncate">
                  {user?.role || "Unassigned"}
                </span>
              </div>

              <div className="flex flex-col rounded-lg bg-slate-50 p-2.5 border border-slate-100 transition-colors hover:bg-slate-100/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Mobile Number
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-900 truncate">
                  {user?.mobile || "Not provided"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Info Banner */}
        {(lockedCompanyId || lockedBranchId) && (
          <div className="shrink-0 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 shadow-sm">
            <Lock className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <p>
              Your active session is tied to a specific company/branch. 
              <span className="font-semibold"> These selections are locked to prevent revoking your own access.</span>
            </p>
          </div>
        )}

        {/* Split View Card */}
        <Card className="border-slate-200 shadow-sm rounded-xl overflow-hidden flex-1 min-h-0 h-0">
          <div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x border-slate-100 bg-white">
            
            {/* Left Panel: Companies List */}
            <div className="md:col-span-5 lg:col-span-4 flex min-h-0 flex-col bg-slate-50/30">
              <div className="px-3 py-2.5 border-b border-slate-100 bg-white flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-slate-500" />
                <h3 className="font-semibold text-slate-800 text-xs">Companies</h3>
              </div>
              
              <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
                {companies.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">No companies available.</p>
                ) : (
                  companies.map((company) => {
                    const companyId = company._id;
                    const isCompanySelected = selectedCompanies.includes(companyId);
                    const isLockedCompany = Boolean(lockedCompanyId) && companyId === lockedCompanyId;
                    const isFocused = focusedCompanyId === companyId;

                    return (
                      <div
                        key={companyId}
                        onClick={() => setFocusedCompanyId(companyId)}
                        className={`group flex cursor-pointer items-center justify-between rounded-md p-2 transition-all ${
                          isFocused
                            ? "bg-slate-200/50 shadow-sm ring-1 ring-slate-200"
                            : "hover:bg-slate-100/50"
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <Checkbox
                            id={`company-${companyId}`}
                            checked={isCompanySelected}
                            disabled={isLockedCompany}
                            onClick={(e) => e.stopPropagation()}
                            onCheckedChange={(checked) => handleCompanyToggle(companyId, Boolean(checked))}
                            className="h-3.5 w-3.5 data-[state=checked]:bg-slate-900 flex-shrink-0"
                          />
                          <div className="flex flex-col truncate">
                            <label
                              htmlFor={`company-${companyId}`}
                              className={`text-xs cursor-pointer select-none truncate ${isFocused ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {company.companyName}
                            </label>
                            {isLockedCompany && (
                              <span className="text-[9px] font-semibold text-blue-600 uppercase tracking-wider">
                                Active Session
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className={`h-3.5 w-3.5 flex-shrink-0 transition-transform ${isFocused ? "text-slate-600 translate-x-1" : "text-transparent group-hover:text-slate-400"}`} />
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Panel: Branches List */}
            <div className="md:col-span-7 lg:col-span-8 flex min-h-0 flex-col bg-white">
              <div className="px-3 py-2.5 border-b border-slate-100 bg-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-500" />
                  <h3 className="font-semibold text-slate-800 text-xs">
                    {focusedCompany ? `Branches: ${focusedCompany.companyName}` : "Branches Selection"}
                  </h3>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto p-3 relative">
                {!focusedCompany ? (
                  <div className="flex h-full flex-col items-center justify-center text-slate-400">
                    <MapPin className="h-10 w-10 mb-3 opacity-20" />
                    <p className="text-sm">Select a company from the left to view its branches.</p>
                  </div>
                ) : !isFocusedCompanySelected ? (
                  <div className="flex h-full flex-col items-center justify-center max-w-sm mx-auto text-center space-y-4">
                    <div className="p-4 bg-slate-50 rounded-full">
                       <ShieldAlert className="h-8 w-8 text-slate-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800 mb-1">Company Access Required</h4>
                      <p className="text-sm text-slate-500 mb-4">You must enable access to <b>{focusedCompany.companyName}</b> before you can assign its branches.</p>
                      <Button 
                        size="sm"
                        variant="outline" 
                        onClick={() => handleCompanyToggle(focusedCompany._id, true)}
                      >
                        Grant Company Access
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {focusedCompanyBranches.length === 0 ? (
                      <p className="text-sm text-slate-500 italic border-l-2 border-slate-200 pl-3">
                        No branches available for this company.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {focusedCompanyBranches.map((branch) => {
                          const selectedBranchIds = selectedBranchesByCompany[focusedCompany._id] || [];
                          const isLockedBranch =
                            Boolean(lockedCompanyId) &&
                            focusedCompany._id === lockedCompanyId &&
                            Boolean(lockedBranchId) &&
                            branch._id === lockedBranchId;
                            
                          const isChecked = selectedBranchIds.includes(branch._id);

                          return (
                            <div
                              key={branch._id}
                              className={`flex items-center justify-between p-2 rounded-md border transition-all ${
                                isChecked 
                                  ? "border-slate-300 bg-slate-50 shadow-sm" 
                                  : "border-slate-100 hover:border-slate-300"
                              }`}
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                <Checkbox
                                  id={`branch-${branch._id}`}
                                  checked={isChecked}
                                  disabled={isLockedBranch}
                                  onCheckedChange={(checked) =>
                                    handleBranchToggle(focusedCompany._id, branch._id, Boolean(checked))
                                  }
                                  className="h-3.5 w-3.5"
                                />
                                <label
                                  htmlFor={`branch-${branch._id}`}
                                  className={`text-xs cursor-pointer select-none truncate ${isChecked ? "font-medium text-slate-800" : "text-slate-600"}`}
                                  title={branch.branchName}
                                >
                                  {branch.branchName}
                                </label>
                              </div>
                              {isLockedBranch && (
                                <Lock className="h-3 w-3 text-emerald-600 flex-shrink-0 ml-2" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </Card>
      </div>
      </div>
    </div>
  );
};

export default UserAccessPage;
