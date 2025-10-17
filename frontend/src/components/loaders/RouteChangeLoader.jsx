// src/components/loaders/RouteChangeLoader.jsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import CustomSquareLoader from "./CustomSquareLoader";

const RouteChangeLoader = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Show loader as soon as route changes
    setLoading(true);

    // Hide after small delay (simulate navigation time)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300); // you can tweak this duration

    return () => clearTimeout(timer);
  }, [location]);

  if (!loading) return null;

  return (
    <div className="fixed z-40 inset-0 bg-white flex items-center justify-center h-[calc(100vh-6px)]">
      <CustomSquareLoader />
    </div>
  );
};

export default RouteChangeLoader;
