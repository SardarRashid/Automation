
import re

filepath = "Job-Portal/src/components/PerformanceAnalytics.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "<p className=\"text-3xl font-black text-slate-900 dark:text-white\">150</p>",
    "<p className=\"text-3xl font-black text-slate-900 dark:text-white\">{totalApplied}</p>"
)

content = content.replace(
    "<p className=\"text-3xl font-black text-slate-900 dark:text-white\">8.0%</p>",
    "<p className=\"text-3xl font-black text-slate-900 dark:text-white\">{interviewRate}%</p>"
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed display values in PerformanceAnalytics.tsx")

