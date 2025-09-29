import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`bg-[#F7F7F7] rounded-xl border border-[#E9E9E9] p-8 shadow-xl flex flex-col items-center max-w-2xl w-full ${className}`}>
    {children}
  </div>
);

export default Card;