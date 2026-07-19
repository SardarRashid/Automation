import os

# Update MobileStockTake.tsx
mst_file = "frontend/src/inventory/components/MobileStockTake.tsx"
with open(mst_file, "r", encoding="utf-8") as f:
    content = f.read()

target_logic = """
      return categories.filter(cat => {
        const catName = (cat.name || '').toLowerCase();
        
        // If a specific room is selected and it has categories defined, STRICTLY filter by that room
        if (storeNum && storeRooms.find(r => r.name.toLowerCase() === storeNum.toLowerCase())?.allowedCategories?.length) {
          return allowedFromRooms.has(catName) || allowedFromRooms.has(cat.id?.toLowerCase() || "");
        }
        
        return userSections.includes("all") || userSections.includes(catName) || allowedFromRooms.has(catName) || allowedFromRooms.has(cat.id?.toLowerCase() || "");
      });
"""

replacement_logic = """
      return categories.filter(cat => {
        const catName = (cat.name || '').toLowerCase();
        const catId = (cat.id || '').toLowerCase();
        
        const isAllowedByUser = userSections.includes("all") || userSections.includes(catName) || userSections.includes(catId);
        
        // If they don't have access to this section, exclude it immediately
        if (!isAllowedByUser) return false;
        
        // If a specific room is selected and it has categories defined, ALSO filter by that room
        if (storeNum && storeRooms.find(r => r.name.toLowerCase() === storeNum.toLowerCase())?.allowedCategories?.length) {
          return allowedFromRooms.has(catName) || allowedFromRooms.has(catId);
        }
        
        return true;
      });
"""

if target_logic in content:
    content = content.replace(target_logic, replacement_logic)
    with open(mst_file, "w", encoding="utf-8") as f:
        f.write(content)
    print("MobileStockTake.tsx RBAC fixed")
else:
    print("Could not find target logic in MobileStockTake.tsx")
