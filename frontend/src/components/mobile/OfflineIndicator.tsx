import React from 'react';
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
