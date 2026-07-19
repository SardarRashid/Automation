import React, { useState } from "react";
import { CategoryTemplate, StoreRoom } from "../types";
import { Plus, Trash2, ListFilter, Sparkles, Check, Warehouse, Layers, FileSpreadsheet, UploadCloud } from "lucide-react";

interface CategoryConsoleProps {
  categories: CategoryTemplate[];
  onSaveCategory: (category: CategoryTemplate) => Promise<void>;
  storeRooms: StoreRoom[];
  onSaveStoreRoom: (room: StoreRoom) => Promise<void>;
  onDeleteStoreRoom: (id: string) => Promise<void>;
}

interface ImportPreview {
  id: string;
  name: string;
  varieties: string[];
  sizes: string[];
  existing: boolean;
  selected: boolean;
}

export function CategoryConsole({ 
  categories, 
  onSaveCategory, 
  storeRooms, 
  onSaveStoreRoom, 
  onDeleteStoreRoom 
}: CategoryConsoleProps) {
  const [activeConsoleTab, setActiveConsoleTab] = useState<"catalog" | "stores">("catalog");
  const [selectedCatId, setSelectedCatId] = useState<string>(categories[0]?.id || "");
  const [newCatName, setNewCatName] = useState("");
  const [newVariety, setNewVariety] = useState("");
  const [newSize, setNewSize] = useState("");
  
  const [newSubVariety, setNewSubVariety] = useState("");
  const [newOrigin, setNewOrigin] = useState("");
  const [newGrade, setNewGrade] = useState("");
  
  // Custom store rooms state help
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreDesc, setNewStoreDesc] = useState("");
  
  const [feedback, setFeedback] = useState("");

  // Bulk CSV Import states
  const [parsedResults, setParsedResults] = useState<ImportPreview[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [mergeMode, setMergeMode] = useState(true);
  const [importFeedback, setImportFeedback] = useState("");

  const activeCategory = categories.find((c) => c.id === selectedCatId) || categories[0];

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const id = newCatName.toLowerCase().trim().replace(/[^a-z0-9]/g, "-");
    if (categories.some((c) => c.id === id)) {
      setFeedback("This category already exists!");
      return;
    }

    const newCat: CategoryTemplate = {
      id,
      name: newCatName.trim(),
      varieties: ["Standard"],
      sizes: ["Standard"]
    };

    await onSaveCategory(newCat);
    setNewCatName("");
    setSelectedCatId(id);
    showFeedback(`Category "${newCat.name}" created successfully!`);
  };

  const handleAddVariety = async () => {
    if (!newVariety.trim() || !activeCategory) return;
    const cleanVariety = newVariety.trim();
    
    if (activeCategory.varieties.includes(cleanVariety)) {
      setFeedback("Variety already exists in this category!");
      return;
    }

    const updatedCat = {
      ...activeCategory,
      varieties: [...activeCategory.varieties, cleanVariety]
    };

    await onSaveCategory(updatedCat);
    setNewVariety("");
    showFeedback(`Added variety "${cleanVariety}"`);
  };

  const handleRemoveVariety = async (variety: string) => {
    if (!activeCategory || activeCategory.varieties.length <= 1) {
      alert("Must keep at least one variety!");
      return;
    }
    const updatedCat = {
      ...activeCategory,
      varieties: activeCategory.varieties.filter((v) => v !== variety)
    };
    await onSaveCategory(updatedCat);
    showFeedback(`Removed variety "${variety}"`);
  };

  const handleAddSize = async () => {
    if (!newSize.trim() || !activeCategory) return;
    const cleanSize = newSize.trim();

    if (activeCategory.sizes.includes(cleanSize)) {
      setFeedback("Size already exists in this category!");
      return;
    }

    const updatedCat = {
      ...activeCategory,
      sizes: [...activeCategory.sizes, cleanSize]
    };

    await onSaveCategory(updatedCat);
    setNewSize("");
    showFeedback(`Added size "${cleanSize}"`);
  };

  const handleRemoveSize = async (sizeStr: string) => {
    if (!activeCategory || activeCategory.sizes.length <= 1) {
      alert("Must keep at least one size!");
      return;
    }
    const updatedCat = {
      ...activeCategory,
      sizes: activeCategory.sizes.filter((s) => s !== sizeStr)
    };
    await onSaveCategory(updatedCat);
    showFeedback(`Removed size "${sizeStr}"`);
  };

  const handleAddSubVariety = async () => {
    if (!newSubVariety.trim() || !activeCategory) return;
    const cleanSub = newSubVariety.trim();
    const subList = activeCategory.subVarieties || [];
    if (subList.includes(cleanSub)) {
      setFeedback("Sub-variety already exists in this category!");
      return;
    }
    const updatedCat = {
      ...activeCategory,
      subVarieties: [...subList, cleanSub]
    };
    await onSaveCategory(updatedCat);
    setNewSubVariety("");
    showFeedback(`Added sub-variety "${cleanSub}"`);
  };

  const handleRemoveSubVariety = async (sub: string) => {
    if (!activeCategory) return;
    const subList = activeCategory.subVarieties || [];
    const updatedCat = {
      ...activeCategory,
      subVarieties: subList.filter((s) => s !== sub)
    };
    await onSaveCategory(updatedCat);
    showFeedback(`Removed sub-variety "${sub}"`);
  };

  const handleAddOrigin = async () => {
    if (!newOrigin.trim() || !activeCategory) return;
    const cleanOrigin = newOrigin.trim();
    const originList = activeCategory.origins || [];
    if (originList.includes(cleanOrigin)) {
      setFeedback("Origin already exists in this category!");
      return;
    }
    const updatedCat = {
      ...activeCategory,
      origins: [...originList, cleanOrigin]
    };
    await onSaveCategory(updatedCat);
    setNewOrigin("");
    showFeedback(`Added origin "${cleanOrigin}"`);
  };

  const handleRemoveOrigin = async (origin: string) => {
    if (!activeCategory) return;
    const originList = activeCategory.origins || [];
    const updatedCat = {
      ...activeCategory,
      origins: originList.filter((o) => o !== origin)
    };
    await onSaveCategory(updatedCat);
    showFeedback(`Removed origin "${origin}"`);
  };

  const handleAddGrade = async () => {
    if (!newGrade.trim() || !activeCategory) return;
    const cleanGrade = newGrade.trim();
    const gradeList = activeCategory.grades || [];
    if (gradeList.includes(cleanGrade)) {
      setFeedback("Grade already exists in this category!");
      return;
    }
    const updatedCat = {
      ...activeCategory,
      grades: [...gradeList, cleanGrade]
    };
    await onSaveCategory(updatedCat);
    setNewGrade("");
    showFeedback(`Added grade "${cleanGrade}"`);
  };

  const handleRemoveGrade = async (grade: string) => {
    if (!activeCategory) return;
    const gradeList = activeCategory.grades || [];
    const updatedCat = {
      ...activeCategory,
      grades: gradeList.filter((g) => g !== grade)
    };
    await onSaveCategory(updatedCat);
    showFeedback(`Removed grade "${grade}"`);
  };

  const handleAddStoreRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;

    const id = "store-" + newStoreName.toLowerCase().trim().replace(/[^a-z0-9]/g, "-");
    if (storeRooms.some((r) => r.id === id || r.name.toLowerCase() === newStoreName.toLowerCase().trim())) {
      setFeedback("Store or Cold Room already exists!");
      return;
    }

    const newRoom: StoreRoom = {
      id,
      name: newStoreName.trim(),
      description: newStoreDesc.trim() || undefined
    };

    await onSaveStoreRoom(newRoom);
    setNewStoreName("");
    setNewStoreDesc("");
    showFeedback(`Cold room "${newRoom.name}" added successfully!`);
  };

  const handleRemoveStoreRoom = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete cold store location "${name}"?`)) return;
    await onDeleteStoreRoom(id);
    showFeedback(`Deleted store room "${name}"`);
  };

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 3500);
  };

  const parseCSV = (text: string): string[][] => {
    const result: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentValue = "";

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentValue += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentValue.trim());
        currentValue = "";
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(currentValue.trim());
        if (row.length > 1 || (row.length === 1 && row[0] !== "")) {
          result.push(row);
        }
        row = [];
        currentValue = "";
      } else {
        currentValue += char;
      }
    }

    if (currentValue || row.length > 0) {
      row.push(currentValue.trim());
      if (row.length > 1 || (row.length === 1 && row[0] !== "")) {
        result.push(row);
      }
    }

    return result;
  };

  const downloadSampleCSV = () => {
    const csvContent = "Category,Variety,Size\n" +
      "Apple,Gala,100\n" +
      "Apple,Gala,113\n" +
      "Apple,Fuji,100\n" +
      "Garlic,Chinese,50mm\n" +
      "Garlic,Chinese,60mm\n" +
      "Grapes,Red Glob,Jumbo\n" +
      "Grapes,White Seedless,M";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "sharbatly_catalog_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const rows = parseCSV(text);
        if (rows.length < 2) {
          showFeedback("Invalid CSV. File must have a header row and at least one data row.");
          return;
        }

        const headers = rows[0].map(h => h.trim().toLowerCase());
        
        let categoryIdx = headers.findIndex(h => h.includes("cat") || h.includes("item") || h.includes("product") || h === "name");
        let varietyIdx = headers.findIndex(h => h.includes("var") || h.includes("type") || h.includes("option") || h === "variety");
        let sizeIdx = headers.findIndex(h => h.includes("size") || h.includes("grade") || h.includes("dimension"));

        if (categoryIdx === -1) categoryIdx = 0;
        if (varietyIdx === -1) varietyIdx = 1;
        if (sizeIdx === -1) sizeIdx = 2;

        const categoriesMap = new Map<string, { name: string; varieties: Set<string>; sizes: Set<string> }>();

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (row.length === 0) continue;

          const catNameVal = row[categoryIdx]?.trim() || "";
          const varVal = row[varietyIdx]?.trim() || "";
          const sizeVal = row[sizeIdx]?.trim() || "";

          if (!catNameVal) continue;

          const catId = catNameVal.toLowerCase().replace(/[^a-z0-9]/g, "-");

          if (!categoriesMap.has(catId)) {
            categoriesMap.set(catId, {
              name: catNameVal,
              varieties: new Set<string>(),
              sizes: new Set<string>()
            });
          }

          const catObj = categoriesMap.get(catId)!;
          if (varVal && varVal.toLowerCase() !== "standard" && varVal !== "-") {
            catObj.varieties.add(varVal);
          }
          if (sizeVal && sizeVal.toLowerCase() !== "standard" && sizeVal !== "-") {
            catObj.sizes.add(sizeVal);
          }
        }

        const parsedPreviews: ImportPreview[] = Array.from(categoriesMap.entries()).map(([id, data]) => {
          const existingCat = categories.find(c => c.id === id);
          
          return {
            id,
            name: data.name,
            varieties: data.varieties.size > 0 ? Array.from(data.varieties) : ["Standard"],
            sizes: data.sizes.size > 0 ? Array.from(data.sizes) : ["Standard"],
            existing: !!existingCat,
            selected: true
          };
        });

        if (parsedPreviews.length === 0) {
          showFeedback("No valid category entries parsed from the CSV.");
          return;
        }

        setParsedResults(parsedPreviews);
        setImportFeedback(`Parsed ${parsedPreviews.length} categories successfully. Review and confirm below!`);
      } catch (err) {
        console.error("Error parsing CSV file:", err);
        showFeedback("Failed to parse CSV file. Ensure it is a valid CSV.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleConfirmImport = async () => {
    const selectedItems = parsedResults.filter(p => p.selected);
    if (selectedItems.length === 0) return;
    setIsImporting(true);

    try {
      let savedCount = 0;
      for (const parsed of selectedItems) {
        let finalCat: CategoryTemplate;
        
        if (mergeMode) {
          const existingCat = categories.find(c => c.id === parsed.id);
          if (existingCat) {
            const mergedVarieties = Array.from(new Set([...existingCat.varieties, ...parsed.varieties]));
            const mergedSizes = Array.from(new Set([...existingCat.sizes, ...parsed.sizes]));
            finalCat = {
              id: parsed.id,
              name: parsed.name,
              varieties: mergedVarieties,
              sizes: mergedSizes
            };
          } else {
            finalCat = {
              id: parsed.id,
              name: parsed.name,
              varieties: parsed.varieties,
              sizes: parsed.sizes
            };
          }
        } else {
          finalCat = {
            id: parsed.id,
            name: parsed.name,
            varieties: parsed.varieties,
            sizes: parsed.sizes
          };
        }

        await onSaveCategory(finalCat);
        savedCount++;
      }

      showFeedback(`Successfully bulk imported ${savedCount} categories into the product catalog!`);
      setParsedResults([]);
      setImportFeedback("");
    } catch (err) {
      console.error("Error importing catalog items:", err);
      showFeedback("An error occurred during import. Please check your data.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      
      {/* Header and Feedback */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-xl font-sans font-bold text-slate-800 flex items-center gap-2">
            <ListFilter className="w-5 h-5 text-green-705" />
            Product Catalog & cold stores Configurator
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            IT management terminal for fruit varieties, category sizing matrices, and cold storage room configurations.
          </p>
        </div>
        {feedback && (
          <div className="bg-green-50 text-green-900 text-xs px-3 py-1.5 rounded-lg border border-yellow-350/50 flex items-center gap-1.5 font-sans font-medium">
            <Check className="w-4 h-4 text-green-700" />
            {feedback}
          </div>
        )}
      </div>

      {/* Primary switcher tabs for catalog vs store rooms */}
      <div className="flex gap-2 mb-6 bg-slate-50 p-1 rounded-xl max-w-lg">
        <button
          onClick={() => setActiveConsoleTab("catalog")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeConsoleTab === "catalog"
              ? "bg-green-850 text-white shadow-md border-b-2 border-yellow-450"
              : "text-slate-600 hover:text-green-800 hover:bg-slate-100/50"
          }`}
        >
          <Layers className="w-4 h-4" />
          Fruits & Vegetables Catalog
        </button>
        <button
          onClick={() => setActiveConsoleTab("stores")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeConsoleTab === "stores"
              ? "bg-green-850 text-white shadow-md border-b-2 border-yellow-450"
              : "text-slate-600 hover:text-green-800 hover:bg-slate-100/50"
          }`}
        >
          <Warehouse className="w-4 h-4" />
          Cold Storage Rooms List
        </button>
      </div>

      {activeConsoleTab === "catalog" ? (
        parsedResults.length > 0 ? (
          /* CATALOG IMPORT STAGING PANEL */
          <div id="catalog-import-staging-panel" className="bg-slate-50 border border-slate-205 rounded-xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
              <div>
                <span className="bg-green-105 text-green-800 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  CSV Import Staging Area
                </span>
                <h3 className="text-lg font-sans font-bold text-slate-800 mt-1">
                  Preview Imported Catalog
                </h3>
                <p className="text-xs text-slate-500 font-sans">
                  Choose specific fruit/vegetable items to import. Resolve duplicate conflicts instantly.
                </p>
              </div>

              <div className="flex items-center gap-2.5 font-sans">
                <button
                  type="button"
                  onClick={() => setParsedResults([])}
                  className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={isImporting || !parsedResults.some(r => r.selected)}
                  className="bg-green-700 hover:bg-green-800 disabled:bg-slate-300 text-white px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  {isImporting ? "Importing..." : "Confirm & Save"}
                </button>
              </div>
            </div>

            {/* Import settings details */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-sans font-bold text-slate-750 mb-2">
                  CONFLICT HANDLING SETTING
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="importMode"
                      checked={mergeMode}
                      onChange={() => setMergeMode(true)}
                      className="mt-0.5 accent-green-600"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-800">Merge with existing categories (Recommended)</span>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                        Appends newly parsed varieties and sizing scales to matching category IDs without losing preconfigured parameters.
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="importMode"
                      checked={!mergeMode}
                      onChange={() => setMergeMode(false)}
                      className="mt-0.5 accent-green-600"
                    />
                    <div>
                      <span className="text-xs font-semibold text-slate-800">Overwrite conflict matches</span>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                        Replaces the list of varieties and sizing guidelines from scratch for any matching category IDs.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="border-t md:border-t-0 md:border-l border-slate-200 md:pl-6 flex flex-col justify-between">
                <div>
                  <label className="block text-xs font-sans font-bold text-slate-700 mb-1 font-semibold">
                    SELECTION STATISTICS
                  </label>
                  <p className="text-xs text-slate-600 font-sans">
                    Total classes in CSV: <span className="font-mono font-bold text-slate-800">{parsedResults.length}</span>
                  </p>
                  <p className="text-xs text-slate-600 mt-1 font-sans">
                    To import: <span className="font-mono font-bold text-slate-800">{parsedResults.filter(p => p.selected).length}</span>
                  </p>
                </div>

                <div className="flex gap-2.5 mt-3 md:mt-0 pt-2 border-t border-slate-100 font-sans">
                  <button
                    type="button"
                    onClick={() => setParsedResults(prev => prev.map(p => ({ ...p, selected: true })))}
                    className="text-[10.5px] text-green-700 hover:underline font-bold cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setParsedResults(prev => prev.map(p => ({ ...p, selected: false })))}
                    className="text-[10.5px] text-slate-505 hover:underline font-bold cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
            </div>

            {/* List of categories parsed preview */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {parsedResults.map((p, idx) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setParsedResults(prev => prev.map((item, i) => i === idx ? { ...item, selected: !item.selected } : item));
                  }}
                  className={`bg-white p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                    p.selected ? "border-green-600 ring-1 ring-green-100" : "border-slate-200 opacity-60 hover:opacity-85"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={p.selected}
                      onChange={() => {}} // click handles it
                      className="mt-1 accent-green-600 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-800">{p.name}</span>
                        <span className="font-mono text-[10px] text-slate-400">ID: {p.id}</span>
                        {p.existing ? (
                          <span className="bg-amber-50 text-amber-700 font-sans border border-amber-200 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                            Matches Existing
                          </span>
                        ) : (
                          <span className="bg-green-50 text-green-755 font-sans border border-green-200 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                            New Category
                          </span>
                        )}
                      </div>

                      <div className="flex gap-4 mt-2 font-sans text-xs text-slate-600 flex-wrap">
                        <div>
                          <strong className="text-slate-500">Varieties ({p.varieties.length}):</strong>{" "}
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-mono font-medium">
                            {p.varieties.join(", ")}
                          </span>
                        </div>
                        <div>
                          <strong className="text-slate-500">Sizes ({p.sizes.length}):</strong>{" "}
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-mono font-medium">
                            {p.sizes.join(", ")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* CATALOG TAB PANEL */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: Categories & Create Category */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <h3 className="text-xs font-mono font-semibold text-slate-400 tracking-wider mb-3">
                  1. REGISTERED CATEGORIES
                </h3>
                
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto mb-4">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCatId(cat.id)}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                        (activeCategory?.id === cat.id)
                          ? "bg-green-800 text-white shadow-md border-b-2 border-yellow-450"
                          : "bg-white hover:bg-green-50 hover:text-green-800 text-slate-700 border border-slate-205"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Create Category Form */}
                <form onSubmit={handleCreateCategory} className="pt-3 border-t border-slate-200/60">
                  <label className="block text-xs font-sans font-semibold text-slate-600 mb-1.5">
                    Add New Main Category:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Garlic, Grapes"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-green-650"
                    />
                    <button
                      type="submit"
                      className="bg-green-55 text-emerald-800 hover:bg-green-100 p-2 rounded-lg border border-green-200 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>

              {/* BULK IMPORT CATALOG (CSV) FIELD */}
              <div id="bulk-import-csv-card" className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <h3 className="text-xs font-mono font-semibold text-slate-400 tracking-wider">
                    BULK IMPORT (CSV)
                  </h3>
                  <button
                    type="button"
                    onClick={downloadSampleCSV}
                    className="text-[10px] text-green-700 hover:underline font-bold uppercase tracking-wider cursor-pointer font-sans"
                  >
                    Template CSV
                  </button>
                </div>

                <div>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
                    Upload a CSV containing <strong>Category</strong>, <strong>Variety</strong>, and <strong>Size</strong> columns to batch load items.
                  </p>

                  <div className="relative border-2 border-dashed border-slate-350 hover:border-green-600 rounded-xl p-5 text-center cursor-pointer transition bg-white group">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="space-y-1.5">
                      <FileSpreadsheet className="w-6 h-6 text-slate-400 mx-auto group-hover:text-green-700 transition" />
                      <p className="text-xs font-bold text-slate-700">
                        Choose CSV Document
                      </p>
                      <p className="text-[9.5px] text-slate-400 font-mono">
                        Supports standard CSV / Excel templates
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          {/* RIGHT COLUMN: Varieties & Sizes configuration for active category */}
          {activeCategory ? (
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              
               {/* Variety Configuration */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col justify-between min-h-[300px]">
                <div>
                  <h3 className="text-xs font-mono font-semibold text-slate-400 tracking-wider mb-2 flex justify-between">
                    <span>2. VARIETIES FOR {activeCategory.name.toUpperCase()}</span>
                    <span className="text-green-700 font-sans font-bold normal-case">
                      {activeCategory.varieties.length} items
                    </span>
                  </h3>

                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                    {activeCategory.varieties.map((v) => (
                      <div
                        key={v}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 flex justify-between items-center group"
                      >
                        <span className="font-medium">{v}</span>
                        <button
                          onClick={() => handleRemoveVariety(v)}
                          className="text-slate-400 hover:text-rose-600 transition-colors opacity-60 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Variety Input */}
                <div className="pt-3 border-t border-slate-200 mt-4">
                  <label className="block text-xs font-sans font-semibold text-slate-600 mb-1.5">
                    Add Variety Option:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Fuji, Golden"
                      value={newVariety}
                      onChange={(e) => setNewVariety(e.target.value)}
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-green-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddVariety();
                      }}
                    />
                    <button
                      onClick={handleAddVariety}
                      className="bg-green-700 hover:bg-green-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

               {/* Size guides configuration */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col justify-between min-h-[300px]">
                <div>
                  <h3 className="text-xs font-mono font-semibold text-slate-400 tracking-wider mb-2 flex justify-between">
                    <span>3. SIZE OPTIONS ({activeCategory.name.toUpperCase()})</span>
                    <span className="text-green-700 font-sans font-bold normal-case">
                      {activeCategory.sizes.length} sizes
                    </span>
                  </h3>

                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                    {activeCategory.sizes.map((s) => (
                      <div
                        key={s}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 flex justify-between items-center group"
                      >
                        <span className="font-semibold font-mono">{s}</span>
                        <button
                          onClick={() => handleRemoveSize(s)}
                          className="text-slate-400 hover:text-rose-600 transition-colors opacity-60 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Add Size Input */}
                <div className="pt-3 border-t border-slate-200 mt-4">
                  <label className="block text-xs font-sans font-semibold text-slate-600 mb-1.5">
                    Add Size Option (e.g. size counts or letters):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 100, 113, Jumbo, L"
                      value={newSize}
                      onChange={(e) => setNewSize(e.target.value)}
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-green-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddSize();
                      }}
                    />
                    <button
                      onClick={handleAddSize}
                      className="bg-green-700 hover:bg-green-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Origin Country Configuration */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col justify-between min-h-[300px]">
                <div>
                  <h3 className="text-xs font-mono font-semibold text-slate-400 tracking-wider mb-2 flex justify-between">
                    <span>4. ORIGINS FOR {activeCategory.name.toUpperCase()}</span>
                    <span className="text-green-700 font-sans font-bold normal-case">
                      {(activeCategory.origins || []).length} origins
                    </span>
                  </h3>

                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                    {(activeCategory.origins || []).length === 0 ? (
                      <div className="text-[11px] text-slate-400 py-4 text-center font-mono uppercase">No origins defined</div>
                    ) : (
                      (activeCategory.origins || []).map((o) => (
                        <div
                          key={o}
                          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 flex justify-between items-center group"
                        >
                          <span className="font-semibold font-sans">{o}</span>
                          <button
                            onClick={() => handleRemoveOrigin(o)}
                            className="text-slate-400 hover:text-rose-600 transition-colors opacity-60 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Add Origin Input */}
                <div className="pt-3 border-t border-slate-200 mt-4">
                  <label className="block text-xs font-sans font-semibold text-slate-600 mb-1.5">
                    Add Origin Options (e.g. Spain, USA):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Spain, Egypt, Chile"
                      value={newOrigin}
                      onChange={(e) => setNewOrigin(e.target.value)}
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-green-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddOrigin();
                      }}
                    />
                    <button
                      onClick={handleAddOrigin}
                      className="bg-green-700 hover:bg-green-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Grade Configuration */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col justify-between min-h-[300px]">
                <div>
                  <h3 className="text-xs font-mono font-semibold text-slate-400 tracking-wider mb-2 flex justify-between">
                    <span>5. QUALITY GRADES ({activeCategory.name.toUpperCase()})</span>
                    <span className="text-green-700 font-sans font-bold normal-case">
                      {(activeCategory.grades || []).length} grades
                    </span>
                  </h3>

                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                    {(activeCategory.grades || []).length === 0 ? (
                      <div className="text-[11px] text-slate-400 py-4 text-center font-mono uppercase">No grades defined</div>
                    ) : (
                      (activeCategory.grades || []).map((g) => (
                        <div
                          key={g}
                          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 flex justify-between items-center group"
                        >
                          <span className="font-semibold font-sans">{g}</span>
                          <button
                            onClick={() => handleRemoveGrade(g)}
                            className="text-slate-400 hover:text-rose-600 transition-colors opacity-60 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Add Grade Input */}
                <div className="pt-3 border-t border-slate-200 mt-4">
                  <label className="block text-xs font-sans font-semibold text-slate-600 mb-1.5">
                    Add Grade Option (e.g. Extra Fancy, Class 1):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Extra Fancy, Class 1"
                      value={newGrade}
                      onChange={(e) => setNewGrade(e.target.value)}
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-green-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddGrade();
                      }}
                    />
                    <button
                      onClick={handleAddGrade}
                      className="bg-green-700 hover:bg-green-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Sub-variety Configuration */}
              <div className="bg-slate-50 flex flex-col justify-between rounded-xl p-4 border border-slate-100 min-h-[300px] md:col-span-2">
                <div>
                  <h3 className="text-xs font-mono font-semibold text-slate-400 tracking-wider mb-2 flex justify-between">
                    <span>6. SUB-VARIETIES SPECIFICS ({activeCategory.name.toUpperCase()})</span>
                    <span className="text-green-700 font-sans font-bold normal-case">
                      {(activeCategory.subVarieties || []).length} sub-varieties
                    </span>
                  </h3>

                  <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(activeCategory.subVarieties || []).length === 0 ? (
                      <div className="col-span-2 text-[11px] text-slate-400 py-4 text-center font-mono uppercase">No sub-varieties defined</div>
                    ) : (
                      (activeCategory.subVarieties || []).map((sub) => (
                        <div
                          key={sub}
                          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 flex justify-between items-center group"
                        >
                          <span className="font-semibold font-sans">{sub}</span>
                          <button
                            onClick={() => handleRemoveSubVariety(sub)}
                            className="text-slate-400 hover:text-rose-600 transition-colors opacity-60 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Add Sub-variety Input */}
                <div className="pt-3 border-t border-slate-200 mt-4 font-sans text-xs">
                  <label className="block text-xs font-sans font-semibold text-slate-600 mb-1.5">
                    Add Sub-variety (e.g. Gala, Extra Sweet):
                  </label>
                  <div className="flex gap-2 max-w-md">
                    <input
                      type="text"
                      placeholder="e.g. Gala, Star, Golden"
                      value={newSubVariety}
                      onChange={(e) => setNewSubVariety(e.target.value)}
                      className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-green-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddSubVariety();
                      }}
                    />
                    <button
                      onClick={handleAddSubVariety}
                      className="bg-green-700 hover:bg-green-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="col-span-8 flex flex-col items-center justify-center p-8 bg-slate-50 border border-slate-150 rounded-xl">
              <Sparkles className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-sans font-medium text-slate-400">
                Create a category template to start configuring options.
              </p>
            </div>
          )}

        </div>
        )
      ) : (
        /* STORES TAB PANEL */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Add Cold Room */}
          <div className="lg:col-span-4 space-y-4">
            <form onSubmit={handleAddStoreRoom} className="bg-slate-50 rounded-xl p-5 border border-slate-100 space-y-4">
              <h3 className="text-xs font-mono font-semibold text-slate-400 tracking-wider flex items-center gap-1">
                <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                REGISTER COLD ROOM
              </h3>
              
              <div>
                <label className="block text-xs font-sans font-semibold text-slate-600 mb-1">
                  Facility Cold Room Name/No: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Room 7, Store 12"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-green-650"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-semibold text-slate-600 mb-1">
                  Section Details or Temperature (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. -2°C to 0°C, Apple Stockpile"
                  value={newStoreDesc}
                  onChange={(e) => setNewStoreDesc(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-green-650"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-green-700 hover:bg-green-800 text-white rounded-lg py-2 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Facility Room
              </button>
            </form>
          </div>

          {/* RIGHT: List Store Rooms */}
          <div className="lg:col-span-8">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 min-h-[300px]">
              <h3 className="text-xs font-mono font-semibold text-slate-400 tracking-wider mb-3 flex justify-between items-center">
                <span>REGISTERED COLD STORE ROOMS</span>
                <span className="text-green-705 font-bold font-sans normal-case">
                  {storeRooms.length} rooms registered
                </span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
                {storeRooms.map((room) => (
                  <div
                    key={room.id}
                    className="bg-white p-3.5 rounded-xl border border-slate-205 flex justify-between items-start group shadow-sm transition-all hover:shadow"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-sans">
                        <Warehouse className="w-3.5 h-3.5 text-green-705" />
                        {room.name}
                      </h4>
                      {room.description && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{room.description}</p>
                      )}
                      <span className="inline-block mt-2 font-mono text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">
                        id: {room.id}
                      </span>
                    </div>

                    <button
                      onClick={() => handleRemoveStoreRoom(room.id, room.name)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1 opacity-50 group-hover:opacity-100"
                      title="Delete Cold Room"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
