import React from 'react';

interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const TouchButton: React.FC<TouchButtonProps> = ({ 
  variant = 'primary', 
  icon, 
  children, 
  className = '', 
  ...props 
}) => {
  const baseClasses = "min-h-[56px] w-full p-4 rounded-2xl font-bold flex justify-center items-center gap-3 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100";
  
  const variants = {
    primary: "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700",
    secondary: "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-700",
    danger: "bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600",
    outline: "bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300 shadow-sm"
  };

  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="w-6 h-6 flex items-center justify-center">{icon}</span>}
      <span className="text-lg">{children}</span>
    </button>
  );
};
