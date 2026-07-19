import re

with open("frontend/src/inventory/components/MobileStockTake.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace `categories` with `sectionFilteredCategories` in catalogItems useMemo
content = re.sub(
    r"const catalogItems = React.useMemo\(\(\) => \{\n    const items: Array<.*?> = \[\];\n\n    // 1. Template-defined standard items\n    categories.forEach\(cat => \{",
    r"const catalogItems = React.useMemo(() => {\n    const items: Array<{\n      id: string;\n      category: string;\n      variety: string;\n      size?: string;\n      grade?: string;\n      originCountry?: string;\n      subVariety?: string;\n      displayName: string;\n      displayDetail: string;\n      source: 'template' | 'record';\n    }> = [];\n\n    const seenKeys = new Set<string>();\n\n    // 1. Template-defined standard items\n    sectionFilteredCategories.forEach(cat => {",
    content,
    flags=re.DOTALL
)

# Actually the file might already have sectionFilteredCategories. Let's just do a string replace on catalogItems useMemo definition.
# Wait, I already saw in my previous tool call:
#  frontend\src\inventory\components\MobileStockTake.tsx:170:    // 1. Template-defined standard items
#  frontend\src\inventory\components\MobileStockTake.tsx:171:    sectionFilteredCategories.forEach(cat => {
# So it ALREADY uses sectionFilteredCategories!
