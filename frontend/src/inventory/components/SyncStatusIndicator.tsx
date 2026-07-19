import React, { useState, useEffect, useMemo, useRef } from 'react';

import { CloudLightning, Database, RefreshCw, AlertCircle } from "lucide-react";
import { subscribeToSyncStatus } from "../services/dbService";
import type { SyncStatusType } from "../services/dbService";

interface SyncStatusIndicatorProps {
  className?: string;
  size?: "sm" | "md";
}

export default function SyncStatusIndicator({ className = "", size = "md" }: SyncStatusIndicatorProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatusType>("synced");
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  // Monitor window network status
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Monitor Firestore sync status changes
  useEffect(() => {
    const unsubscribe = subscribeToSyncStatus((status) => {
      setSyncStatus(status);
    });
    return unsubscribe;
  }, []);

  // Compute background and text styles based on composite online + sync state
  let badgeColor = "";
  let icon = null;
  let text = "";
  let dotAnimation = "";
  let dotColor = "";

  if (!online) {
    // Completely offline, records cached locally
    badgeColor = "bg-amber-955/70 text-amber-300 border-amber-600/40";
    icon = <CloudLightning className="w-3.5 h-3.5 shrink-0 text-amber-400" />;
    text = "OFFLINE MODE • CACHED SECURELY";
    dotColor = "bg-amber-400 animate-pulse";
  } else if (syncStatus === "saving") {
    // In progress of sending to firestore
    badgeColor = "bg-blue-955/75 text-blue-300 border-blue-600/40";
    icon = <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin text-blue-400" />;
    text = "SYNCING TO CLOUD...";
    dotColor = "bg-blue-400";
  } else if (syncStatus === "pending_offline") {
    // Save failed or is pending offline queue resolution
    badgeColor = "bg-orange-955/70 text-orange-300 border-orange-600/40";
    icon = <AlertCircle className="w-3.5 h-3.5 shrink-0 text-orange-400" />;
    text = "PENDING CLOUD SYNC";
    dotColor = "bg-orange-400 animate-pulse";
  } else {
    // Fully synced and online
    badgeColor = "bg-emerald-950/70 text-emerald-300 border-emerald-700/50";
    icon = <Database className="w-3.5 h-3.5 shrink-0 text-emerald-450" />;
    text = "ALL SAVES SECURED";
    dotColor = "bg-emerald-400";
    dotAnimation = "scale-100";
  }

  

  return (
    <div
      id="sync-status-indicator"
      className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-[10.5px] font-mono font-bold tracking-wider border transition-all duration-300 select-none ${badgeColor} ${className}`}
      title={`Network: ${online ? "ONLINE" : "OFFLINE"} | Cloud Sync: ${syncStatus.toUpperCase()}`}
    >
      <div className="relative flex h-2 w-2 shrink-0">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${online && syncStatus === "saving" ? "animate-ping bg-blue-405" : ""} ${syncStatus === "pending_offline" || !online ? "animate-ping bg-amber-410" : ""}`} />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor} ${dotAnimation}`} />
      </div>
      
      {icon}
      
      <span>{text}</span>
    </div>
  );
}
