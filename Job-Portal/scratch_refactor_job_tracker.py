import os

filepath = 'src/components/JobTrackerDetails.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

badge_html = """
              {activeApp.countryRulesApplied && activeApp.countryRulesApplied.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {activeApp.countryRulesApplied.map((rule, idx) => (
                    <span key={idx} className="px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-[10px] font-bold rounded flex items-center gap-1 border border-amber-200 dark:border-amber-800/50">
                      <Sparkles className="h-3 w-3" />
                      {rule} Applied
                    </span>
                  ))}
                </div>
              )}
"""

target_copy_button_end = '</button>\n                </div>'
if target_copy_button_end in content:
    content = content.replace(target_copy_button_end, target_copy_button_end + badge_html)
else:
    print('Target not found')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print('JobTrackerDetails updated.')
