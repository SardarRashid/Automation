import os
import re

db_filepath = 'frontend/src/inventory/services/dbService.ts'
with open(db_filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the old global event listener
old_listener = """// Auto sync when online status changes
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    syncOfflineData();
  });
}"""
content = content.replace(old_listener, "")

# Add getPendingSyncCount
pending_count_func = """
export function getPendingSyncCount(): number {
  if (typeof window === "undefined") return 0;
  let count = 0;
  try {
    const localLogs = localStorage.getItem("activity_logs");
    if (localLogs) {
      const logs = JSON.parse(localLogs);
      if (Array.isArray(logs)) count += logs.length;
    }
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("local_records_")) {
        const val = localStorage.getItem(key);
        if (val) {
          const records = JSON.parse(val);
          if (Array.isArray(records)) {
            count += records.filter((r: any) => r.id && r.id.startsWith("lcl_")).length;
          }
        }
      }
    }
  } catch (e) {
    console.error("Error calculating pending sync count", e);
  }
  return count;
}
"""

content = content.replace("export function updateSyncStatus(status: SyncStatusType) {", pending_count_func + "\nexport function updateSyncStatus(status: SyncStatusType) {")

with open(db_filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("dbService.ts updated.")


indicator_filepath = 'frontend/src/inventory/components/SyncStatusIndicator.tsx'
with open(indicator_filepath, 'r', encoding='utf-8') as f:
    ind = f.read()

# Add getPendingSyncCount and syncOfflineData to imports
ind = ind.replace('import { subscribeToSyncStatus } from "../services/dbService";',
                  'import { subscribeToSyncStatus, syncOfflineData, getPendingSyncCount } from "../services/dbService";')

# Inject effect for syncOfflineData and pending counter logic
old_effect = """  // Monitor window network status
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);"""

new_effect = """  const [pendingCount, setPendingCount] = useState(0);

  // Monitor window network status and run sync on reconnect
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      syncOfflineData();
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check on mount: If we are online but have pending offline items (e.g. from previous session)
    if (navigator.onLine) {
      const count = getPendingSyncCount();
      if (count > 0) {
        syncOfflineData();
      }
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);"""

ind = ind.replace(old_effect, new_effect)

# Update sync status text logic to include pending count
old_pending_logic = """  } else if (syncStatus === "pending_offline") {
    // Save failed or is pending offline queue resolution
    badgeColor = "bg-orange-955/70 text-orange-300 border-orange-600/40";
    icon = <AlertCircle className="w-3.5 h-3.5 shrink-0 text-orange-400" />;
    text = "PENDING CLOUD SYNC";
    dotColor = "bg-orange-400 animate-pulse";
  } else {"""

new_pending_logic = """  } else if (syncStatus === "pending_offline") {
    const count = getPendingSyncCount();
    if (count > 0 && count !== pendingCount) setPendingCount(count);
    badgeColor = "bg-orange-955/70 text-orange-300 border-orange-600/40";
    icon = <AlertCircle className="w-3.5 h-3.5 shrink-0 text-orange-400" />;
    text = count > 0 ? `${count} PENDING ITEMS` : "PENDING CLOUD SYNC";
    dotColor = "bg-orange-400 animate-pulse";
  } else {"""

ind = ind.replace(old_pending_logic, new_pending_logic)

with open(indicator_filepath, 'w', encoding='utf-8') as f:
    f.write(ind)
print("SyncStatusIndicator.tsx updated.")
