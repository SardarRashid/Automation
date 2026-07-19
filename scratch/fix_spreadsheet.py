
import re

filepath = "frontend/src/components/ui/SpreadsheetGrid.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Make rowKey optional
old_prop = "rowKey: (row: T) => string;"
new_prop = "rowKey?: (row: T) => string;"
content = content.replace(old_prop, new_prop)

# Fix the implementation
old_impl = """            {filteredAndSortedData.map((row, idx) => {
              const rId = rowKey(row);"""
new_impl = """            {filteredAndSortedData.map((row, idx) => {
              const rId = typeof rowKey === "function" ? rowKey(row) : ((row as any).id || (row as any).key || String(idx));"""
content = content.replace(old_impl, new_impl)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("SpreadsheetGrid fixed")

