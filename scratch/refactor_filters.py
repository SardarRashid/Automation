import os

# Update DailySheetView.tsx
path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\inventory\components\DailySheetView.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace category filter logic
cat_filter_orig = """  // Filter permitted categories based on staff permissions assignment
  const permittedCategories = categories.filter(cat => 
    isFullAccess || currentUser.assignedSection === "All" ||
    currentUser.assignedSection.toLowerCase().split(",").map(val => val.trim()).filter(Boolean).includes((cat.name || '').toLowerCase().trim())
  );"""

cat_filter_new = """  // Under Room-First assignment, storekeepers automatically see all categories 
  // UNLESS they have specific category restrictions set.
  const permittedCategories = categories.filter(cat => {
    if (isFullAccess || !currentUser.assignedSection || currentUser.assignedSection === "All") return true;
    return currentUser.assignedSection.toLowerCase().split(",").map(val => val.trim()).filter(Boolean).includes((cat.name || '').toLowerCase().trim());
  });"""

content = content.replace(cat_filter_orig, cat_filter_new)

# Replace fastCat init
fast_cat_orig = """  const [fastCat, setFastCat] = useState(() => {
    const permitted = categories.filter(cat => 
      isFullAccess || currentUser.assignedSection === "All" ||
      currentUser.assignedSection.toLowerCase().split(",").map(val => val.trim()).filter(Boolean).includes((cat.name || '').toLowerCase().trim())
    );
    return permitted[0]?.name || categories[0]?.name || "Apple";
  });"""

fast_cat_new = """  const [fastCat, setFastCat] = useState(() => {
    const permitted = categories.filter(cat => {
      if (isFullAccess || !currentUser.assignedSection || currentUser.assignedSection === "All") return true;
      return currentUser.assignedSection.toLowerCase().split(",").map(val => val.trim()).filter(Boolean).includes((cat.name || '').toLowerCase().trim());
    });
    return permitted[0]?.name || categories[0]?.name || "Apple";
  });"""

content = content.replace(fast_cat_orig, fast_cat_new)

# Replace records filter
record_filter_orig = """  const filteredRecords = records.filter(r => {
    // 1. Check supervisor / storekeeper category role lock
    const matchSection = isFullAccess || currentUser.assignedSection === "All" ||
      currentUser.assignedSection.toLowerCase().split(",").map(val => val.trim()).filter(Boolean).includes(r.category.toLowerCase().trim());
    
    // 2. Check cold store room assignment lock
    const matchStore = isFullAccess || currentUser.assignedStoreNum === "All" ||
      currentUser.assignedStoreNum.toLowerCase().split(",").map(val => val.trim()).filter(Boolean).includes(r.location.toLowerCase().trim()) ||
      currentUser.assignedStoreNum.toLowerCase().split(",").map(val => val.trim()).filter(Boolean).some(store => r.location.toLowerCase().includes(store));

    if (!matchSection || !matchStore) return false;"""

record_filter_new = """  const filteredRecords = records.filter(r => {
    // 1. Room-First assignment: Check cold store room assignment lock first
    const matchStore = isFullAccess || !currentUser.assignedStoreNum || currentUser.assignedStoreNum === "All" ||
      currentUser.assignedStoreNum.toLowerCase().split(",").map(val => val.trim()).filter(Boolean).includes(r.location.toLowerCase().trim()) ||
      currentUser.assignedStoreNum.toLowerCase().split(",").map(val => val.trim()).filter(Boolean).some(store => r.location.toLowerCase().includes(store));

    if (!matchStore) return false;

    // 2. Check specific category restrictions (if applied)
    const hasSpecificRestrictions = currentUser.assignedSection && currentUser.assignedSection !== "All";
    if (hasSpecificRestrictions && !isFullAccess) {
      const matchSection = currentUser.assignedSection.toLowerCase().split(",").map(val => val.trim()).filter(Boolean).includes(r.category.toLowerCase().trim());
      if (!matchSection) return false;
    }"""

content = content.replace(record_filter_orig, record_filter_new)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)



# Update MobileStockTake.tsx
path2 = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\inventory\components\MobileStockTake.tsx"
with open(path2, "r", encoding="utf-8") as f:
    content2 = f.read()

# Replace category filter
cat_filter2_orig = """  const sectionFilteredCategories = React.useMemo(() => {
    if (!currentUser) return [];

    const userSections = currentUser.assignedSection === "All" 
      ? ["all"] 
      : (currentUser.assignedSection || "").toLowerCase().split(",").map(v => v.trim()).filter(Boolean);

    return categories.filter(cat => {
      // Check if user is assigned to this section OR if they have "All"
      const matchSection = userSections.includes("all") || userSections.includes(cat.name.toLowerCase().trim());
      if (!matchSection) return false;

      // Ensure the room actually holds this category (from StoreRooms config)
      if (storeNum !== "All") {
        const room = storeRooms.find(r => r.name === storeNum);
        if (room && room.allowedCategories && room.allowedCategories.length > 0) {
          if (!room.allowedCategories.includes(cat.id)) {
            return false;
          }
        }
      }
      return true;
    });
  }, [categories, currentUser.assignedSection, storeNum, storeRooms]);"""

cat_filter2_new = """  const sectionFilteredCategories = React.useMemo(() => {
    if (!currentUser) return [];

    const hasSpecificRestrictions = currentUser.assignedSection && currentUser.assignedSection !== "All";
    const userSections = hasSpecificRestrictions 
      ? currentUser.assignedSection.toLowerCase().split(",").map(v => v.trim()).filter(Boolean)
      : [];

    return categories.filter(cat => {
      if (hasSpecificRestrictions) {
        const matchSection = userSections.includes(cat.name.toLowerCase().trim());
        if (!matchSection) return false;
      }

      // Ensure the room actually holds this category (from StoreRooms config)
      if (storeNum !== "All") {
        const room = storeRooms.find(r => r.name === storeNum);
        if (room && room.allowedCategories && room.allowedCategories.length > 0) {
          if (!room.allowedCategories.includes(cat.id)) {
            return false;
          }
        }
      }
      return true;
    });
  }, [categories, currentUser.assignedSection, storeNum, storeRooms]);"""

content2 = content2.replace(cat_filter2_orig, cat_filter2_new)

# Replace categoryName initialization
cat_name_orig = """  const [categoryName, setCategoryName] = useState(() => {
    if (sectionFilteredCategories.length > 0) {
      return sectionFilteredCategories[0].name;
    }
    // Fallback logic to check existing records
    if (currentUser) {
      const allRecords = [...records, ...yesterdayRecords];
      allRecords.forEach(rec => {
        const isAuthorized = currentUser.assignedSection === "All" || 
          currentUser.assignedSection.toLowerCase().split(",").map(val => val.trim()).filter(Boolean).includes(rec.category.toLowerCase());
        if (!isAuthorized) return;
        // if store is matched...
      });
    }
    return categories[0]?.name || "Apple";
  });"""

cat_name_new = """  const [categoryName, setCategoryName] = useState(() => {
    if (sectionFilteredCategories.length > 0) {
      return sectionFilteredCategories[0].name;
    }
    return categories[0]?.name || "Apple";
  });"""

content2 = content2.replace(cat_name_orig, cat_name_new)

# Replace records filter
record_filter2_orig = """      // Filter records according to section permission unless it is "All"
      const filtered = data.filter(rec => {
        const matchSection = currentUser.assignedSection === "All" || 
          currentUser.assignedSection.toLowerCase().split(",").map(val => val.trim()).filter(Boolean).includes(rec.category.toLowerCase().trim()) ||
          rec.category.toLowerCase().trim() === categoryName.toLowerCase().trim();
          
        const matchStore = currentUser.assignedStoreNum === "All" || 
          currentUser.assignedStoreNum.toLowerCase().split(",").map(val => val.trim()).filter(Boolean).includes(rec.location.toLowerCase().trim()) ||
          rec.location.toLowerCase().trim() === storeNum.toLowerCase().trim();
          
        return matchSection && matchStore;
      });"""

record_filter2_new = """      // Filter records
      const filtered = data.filter(rec => {
        const matchStore = !currentUser.assignedStoreNum || currentUser.assignedStoreNum === "All" || 
          currentUser.assignedStoreNum.toLowerCase().split(",").map(val => val.trim()).filter(Boolean).includes(rec.location.toLowerCase().trim()) ||
          rec.location.toLowerCase().trim() === storeNum.toLowerCase().trim();
          
        if (!matchStore) return false;

        const hasSpecificRestrictions = currentUser.assignedSection && currentUser.assignedSection !== "All";
        if (hasSpecificRestrictions) {
          const matchSection = currentUser.assignedSection.toLowerCase().split(",").map(val => val.trim()).filter(Boolean).includes(rec.category.toLowerCase().trim());
          if (!matchSection) return false;
        }
        
        return rec.category.toLowerCase().trim() === categoryName.toLowerCase().trim();
      });"""

content2 = content2.replace(record_filter2_orig, record_filter2_new)

with open(path2, "w", encoding="utf-8") as f:
    f.write(content2)

print("Updated DailySheetView.tsx and MobileStockTake.tsx!")
