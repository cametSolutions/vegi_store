import { useMemo, useState } from "react";
import {
  Building2,
  RefreshCw,
  AlertTriangle,
  Home,
  LogOut,
  Phone,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getLocalStorageItem } from "@/helper/localstorage";
import { useQueryClient } from "@tanstack/react-query";

const NoCompanyDataErrorPage = ({ onRetry, onGoHome, onLogout }) => {
  const queryClient = useQueryClient();
  const userData = useMemo(() => getLocalStorageItem("user"), []);
  const userEmail = userData?.email || "";

  const handleRetry = () => {
    queryClient.invalidateQueries({ queryKey: ["users", userData?._id] }); // Invalidate all queries to refetch data
  };

  if (userData === null) {
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-0">
      {/* Make the card full width */}
      <Card className="w-full h-full rounded-none shadow-lg border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-6 pt-10">
          <div className="mx-auto w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Building2 className="w-10 h-10 text-orange-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
            No Company Data Found
          </CardTitle>
          <p className="text-gray-600 text-lg">
            We couldn't load your company information
          </p>
        </CardHeader>

        <CardContent className="space-y-6 max-w-3xl mx-auto w-full px-6 pb-10">
          {/* Error Alert */}
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Critical Error:</strong> Company data is missing from your
              session. This is required to access the application features.
            </AlertDescription>
          </Alert>

          {/* Possible Causes */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">
              Possible causes:
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                Your session may have expired
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                Company access permissions may have been revoked
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                Network connection issues during data loading
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                Server maintenance or temporary outage
              </li>
            </ul>
          </div>

          {/* User Info */}
          {userEmail && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 flex items-center text-sm gap-2">
              <h3 className="font-semibold text-blue-900 ">Current User:</h3>
              <p className="text-blue-800 ">{userEmail}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleRetry}
              className="flex-1 bg-blue-600 hover:bg-blue-700 h-10"
              size="lg"
            >
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Loading
              </>
            </Button>

            <Button
              onClick={onLogout}
              variant="outline"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50 h-10"
              size="lg"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out & Login Again
            </Button>
          </div>

          {/* Support Information */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-center">
              Need Help?
            </h3>
            <div className="flex justify-center gap-6">
              <a
                href="tel:+1234567890"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Phone className="w-4 h-4" />
                Call Support
              </a>
              <a
                href="mailto:support@company.com"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Email Support
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NoCompanyDataErrorPage;
