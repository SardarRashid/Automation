import os
import re

filepath = 'src/components/AutomationHub.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
if "import AutoApplyVisualizer" not in content:
    content = content.replace("import { useState, useEffect } from 'react';", "import { useState, useEffect } from 'react';\nimport AutoApplyVisualizer from './AutoApplyVisualizer';")

# Add component rendering just below the headers/metrics in AutomationHub
# Look for: <div className="space-y-6"> return statement
if "<AutoApplyVisualizer isActive={isLoopActive} />" not in content:
    # Inject it directly after the Stats Grid (which ends before "Current Queue")
    # Actually, simpler to put it at the very top of the main container
    content = content.replace('<div className="space-y-6">\n', '<div className="space-y-6">\n      <AutoApplyVisualizer isActive={isLoopActive} />\n')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Injected AutoApplyVisualizer into AutomationHub.")
