import React from "react";
import { Home, ShoppingCart, Search, Leaf } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="h-[calc(100vh-106px)] bg-[#e9f5eb] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative leaves in background */}
      <div className="absolute inset-0 pointer-events-none">
        <Leaf className="absolute top-10 left-10 w-8 h-8 text-green-200 opacity-60 rotate-12 animate-pulse" />
        <Leaf
          className="absolute top-32 right-16 w-6 h-6 text-green-300 opacity-50 -rotate-45 animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <Leaf
          className="absolute bottom-20 left-20 w-10 h-10 text-green-200 opacity-40 rotate-45 animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <Leaf
          className="absolute bottom-40 right-10 w-7 h-7 text-green-300 opacity-60 -rotate-12 animate-pulse"
          style={{ animationDelay: "0.5s" }}
        />
      </div>

      <div className="max-w-2xl w-full text-center relative z-10">
        {/* Content */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-green-700 drop-shadow-lg">
              404
            </h1>
            <h2 className="text-3xl font-bold text-green-800 mb-4">
              Oops! This page went missing!
            </h2>
            <p className="text-lg text-black max-w-xl mx-auto leading-relaxed">
              The page you are looking for does not exist or has been moved.
              Please return to the dashboard to continue your work.
            </p>
          </div>

          {/* Action buttons */}
          <Link to="/" className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <button className="group inline-flex items-center px-6 py-3 text-white bg-orange-400 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 hover:bg-orange-500">
              <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Back to Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
