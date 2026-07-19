import re

path = r"D:\AntiGravity\Latest_Active_Apps\inventory-web-workspace\frontend\src\inventory\components\StaffManagementView.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update State variables to track editStoreNum and editSections
edit_state_orig = r"  // Edit State\n  const \[editSections, setEditSections\] = useState<string\[\]>\(\[\]\);"
edit_state_new = """  // Edit State
  const [editSections, setEditSections] = useState<string[]>([]);
  const [editStores, setEditStores] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);"""
content = re.sub(edit_state_orig, edit_state_new, content)

# 2. Update handleEditClick
handle_edit_orig = r"  const handleEditClick = \(user: Storekeeper\) => \{\n    setEditingUserId\(user\.id\);\n    setEditSections\(user\.assignedSection && user\.assignedSection !== \"All\" \? user\.assignedSection\.split\(\",\"\)\.map\(s => s\.trim\(\)\) : \[\]\);\n  \};"
handle_edit_new = """  const handleEditClick = (user: Storekeeper) => {
    setEditingUserId(user.id);
    setEditSections(user.assignedSection && user.assignedSection !== "All" ? user.assignedSection.split(",").map(s => s.trim()) : []);
    setEditStores(user.assignedStoreNum && user.assignedStoreNum !== "All" ? user.assignedStoreNum.split(",").map(s => s.trim()) : []);
    setShowAdvanced(!!(user.assignedSection && user.assignedSection !== "All"));
  };"""
content = re.sub(handle_edit_orig, handle_edit_new, content)

# 3. Update handleSave
handle_save_orig = r"        // Update directly in Firebase\n        await update\(ref\(database, `users/\$\{userId\}`\), \{\n          assignedSection: editSections\.length > 0 \? editSections\.join\(\",\"\) : \"All\"\n        \}\);"
handle_save_new = """        // Update directly in Firebase
        await update(ref(database, `users/${userId}`), {
          assignedStoreNum: editStores.length > 0 ? editStores.join(",") : "All",
          assignedSection: editSections.length > 0 && showAdvanced ? editSections.join(",") : "All"
        });"""
content = re.sub(handle_save_orig, handle_save_new, content)

# 4. Update the UI for the Category Column (Advanced) and Store Column (Primary)
table_orig = r"                  <td className=\"px-6 py-4\">\n                    \{editingUserId === user\.id \? \(\n                      <div className=\"flex items-center gap-2\">\n                        <Layers className=\"w-4 h-4 text-slate-400 shrink-0\" />\n                        <div className=\"flex flex-col gap-1 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-white w-full\">\n                          \{categories\.map\(c => \{\n                            const catName = \(c as any\)\.category \|\| c\.name; // Fallback for schema mismatches\n                            const isChecked = editSections\.includes\(catName\);\n                            return \(\n                              <label key=\{c\.id\} className=\"flex items-center gap-2 text-sm text-slate-700 cursor-pointer p-1 hover:bg-slate-50 rounded\">\n                                <input \n                                  type=\"checkbox\"\n                                  checked=\{isChecked\}\n                                  onChange=\{\(e\) => \{\n                                    if \(e\.target\.checked\) \{\n                                      setEditSections\(\[\.\.\.editSections, catName\]\);\n                                    \} else \{\n                                      setEditSections\(editSections\.filter\(s => s !== catName\)\);\n                                    \}\n                                  \}\}\n                                  className=\"rounded border-slate-300 text-emerald-600 focus:ring-emerald-500\"\n                                />\n                                \{catName\}\n                              </label>\n                            \);\n                          \}\)\}\n                        </div>\n                      </div>\n                    \) : \(\n                      <div className=\"font-medium text-slate-700\">\{user\.assignedSection \|\| \"All\"\}</div>\n                    \)\}\n                  </td>\n                  <td className=\"px-6 py-4\">\n                    <div className=\"font-medium text-slate-700\">\{user\.assignedStoreNum \|\| \"All\"\}</div>\n                  </td>"

table_new = """                  <td className="px-6 py-4">
                    {editingUserId === user.id ? (
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={showAdvanced} 
                            onChange={(e) => {
                              setShowAdvanced(e.target.checked);
                              if (!e.target.checked) setEditSections([]);
                            }}
                            className="rounded border-slate-300 text-emerald-600"
                          />
                          Restrict By Category?
                        </label>
                        {showAdvanced && (
                          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-white w-full">
                            {categories.map(c => {
                              const catName = (c as any).category || c.name;
                              const isChecked = editSections.includes(catName);
                              return (
                                <label key={c.id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer p-1 hover:bg-slate-50 rounded">
                                  <input 
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setEditSections([...editSections, catName]);
                                      } else {
                                        setEditSections(editSections.filter(s => s !== catName));
                                      }
                                    }}
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                  />
                                  {catName}
                                </label>
                              );
                            })}
                          </div>
                        )}
                        {!showAdvanced && <div className="text-xs text-slate-400 italic">User sees all categories in their assigned rooms.</div>}
                      </div>
                    ) : (
                      <div className="font-medium text-slate-700">
                        {(!user.assignedSection || user.assignedSection === "All") ? (
                          <span className="text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-md">All (Room Based)</span>
                        ) : (
                          user.assignedSection
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingUserId === user.id ? (
                      <div className="flex items-center gap-2 min-w-[200px]">
                        <Store className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="flex flex-col gap-1 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2 bg-white w-full">
                          {storeRooms.map(r => {
                            const isChecked = editStores.includes(r.name);
                            return (
                              <label key={r.id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer p-1 hover:bg-slate-50 rounded">
                                <input 
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setEditStores([...editStores, r.name]);
                                    } else {
                                      setEditStores(editStores.filter(s => s !== r.name));
                                    }
                                  }}
                                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                {r.name}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="font-medium text-slate-700">{user.assignedStoreNum || "All"}</div>
                    )}
                  </td>"""

content = re.sub(table_orig, table_new, content)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated StaffManagementView.tsx!")
