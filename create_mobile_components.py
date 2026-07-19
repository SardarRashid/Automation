import os

components_dir = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\components\mobile"
os.makedirs(components_dir, exist_ok=True)

# 1. OfflineIndicator.tsx
with open(os.path.join(components_dir, "OfflineIndicator.tsx"), "w", encoding="utf-8") as f:
    f.write("""import React from 'react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-2 flex items-center justify-center gap-2 z-50 text-sm font-medium shadow-md shadow-red-500/20">
      <WifiOff className="w-4 h-4 animate-pulse" />
      You are currently offline. Changes will sync when reconnected.
    </div>
  );
};
""")

# 2. SuccessOverlay.tsx
with open(os.path.join(components_dir, "SuccessOverlay.tsx"), "w", encoding="utf-8") as f:
    f.write("""import React from 'react';
import { CheckCircle } from 'lucide-react';

interface SuccessOverlayProps {
  isVisible: boolean;
  message?: string;
}

export const SuccessOverlay: React.FC<SuccessOverlayProps> = ({ isVisible, message = "Success!" }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-[100] flex flex-col items-center justify-center transition-all duration-300">
      <div className="animate-bounce">
        <CheckCircle className="w-24 h-24 text-emerald-500" />
      </div>
      <h2 className="mt-4 text-2xl font-bold text-gray-800 tracking-tight animate-pulse">{message}</h2>
    </div>
  );
};
""")

# 3. TouchButton.tsx
with open(os.path.join(components_dir, "TouchButton.tsx"), "w", encoding="utf-8") as f:
    f.write("""import React from 'react';

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
""")

print("Mobile components created.")
