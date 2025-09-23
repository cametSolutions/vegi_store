import React from "react";
import { Phone, Mail, Leaf, Facebook, Twitter, Youtube } from "lucide-react";

function TopBar() {
  return (
    <div className="bg-emerald-500 text-white px-4 py-2 text-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Phone size={16} />
            <span>+977 42647190</span>
          </div>
          <div className="flex items-center space-x-2">
            <Mail size={16} />
            <span>veggieshop@example.com</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm">Follow us:</span>
          <div className="flex space-x-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
              <Facebook size={16} />
            </div>
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
              <Twitter size={16} />
            </div>
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
              <Youtube size={16} />
            </div>
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
              <Leaf size={16} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TopBar;
