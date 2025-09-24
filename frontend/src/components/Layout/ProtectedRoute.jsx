import { getLocalStorageItem } from "@/helper/localstorage";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const user = getLocalStorageItem("user");

  if (!user) {
    // If no user, redirect to login
    return <Navigate to="/login" replace />;
  }

  // If user exists, render the component
  return children;
};

export default ProtectedRoute;
