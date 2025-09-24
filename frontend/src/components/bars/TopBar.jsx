import React from "react";
import { Phone, Mail, Leaf, Facebook, Twitter, Youtube } from "lucide-react";

function TopBar() {
  return (
    <div className="bg-emerald-500 text-white px-5 py-1.5 text-xs ">
      <div className="mx-auto flex justify-between items-center">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Phone size={12} />
            <span>+977 42647190</span>
          </div>
          <div className="flex items-center space-x-1">
            <Mail size={12} />
            <span>veggieshop@example.com</span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-3">
          <span className="text-xs">Follow us:</span>
          <div className="flex space-x-1.5">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
              <Facebook size={12} />
            </div>
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
              <Twitter size={12} />
            </div>
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
              <Youtube size={12} />
            </div>
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
              <Leaf size={12} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TopBar;
