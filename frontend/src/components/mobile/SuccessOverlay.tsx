import React from 'react';
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
