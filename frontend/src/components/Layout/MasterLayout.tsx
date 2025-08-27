import React from "react";

interface MastersLayoutProps {
  title: string;
  children: React.ReactNode;
}

const MastersLayout: React.FC<MastersLayoutProps> = ({ title, children }) => {
  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      {children}
    </div>
  );
};

export default MastersLayout;
