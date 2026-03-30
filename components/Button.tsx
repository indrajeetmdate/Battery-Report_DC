import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "px-6 py-3 rounded-full font-bold uppercase tracking-wider transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed border-2 border-transparent";
  
  const variants = {
    primary: "bg-[#78AD3E] border-[#78AD3E] hover:bg-[#1A1C19] hover:border-[#1A1C19] text-white shadow-sm",
    secondary: "bg-[#1A1C19] border-[#1A1C19] text-white hover:bg-[#78AD3E] hover:border-[#78AD3E]",
    outline: "border-[#1A1C19] text-[#1A1C19] hover:bg-[#1A1C19] hover:text-white border-2"
  };

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};