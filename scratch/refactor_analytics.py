
import re

filepath = "Job-Portal/src/components/PerformanceAnalytics.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Replace static arrays and the component signature
# The component starts with:
# const funnelData = [...]
# const salaryData = [...]
# export default function PerformanceAnalytics() {

imports = """import React, { useMemo } from \x27react\x27;
import { motion } from \x27motion/react\x27;
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, AreaChart, Area } from \x27recharts\x27;
import { Activity, Target, TrendingUp, Users, CheckCircle2, XCircle, BarChart3 } from \x27lucide\x27react\x27;
import { JobApplication, UserProfile } from \x27../types\x27;"""

content = re.sub(r"import React.*?\n.*?\n.*?\n.*?\n", imports + "\n\n", content, count=1)

# Signature and dynamic calculation
dynamic_code = """
interface Props {
  applications?: JobApplication[];
  profile?: UserProfile;
}

export default function PerformanceAnalytics({ applications = [], profile }: Props) {
  const {
    funnelData,
    totalApplied,
    interviewRate,
    offerRate,
    salaryData
  } = useMemo(() => {
    const applied = applications.filter(a => a.status === \x27applied\x27 || a.status === \x27interviewing\x27 || a.status === \x27offered\x27 || a.status === \x27rejected\x27).length;
    const screening = applications.filter(a => a.status === \x27interviewing\x27 || a.status === \x27offered\x27).length; // rough proxy for passing initial screen
    const interviewing = applications.filter(a => a.status === \x27interviewing\x27 || a.status === \x27offered\x27).length;
    const offers = applications.filter(a => a.status === \x27offered\x27).length;

    const fData = [
      { name: \x27Applied\x27, value: applied || 1, color: \x27#3b82f6\x27 },
      { name: \x27Screening\x27, value: screening, color: \x27#8b5cf6\x27 },
      { name: \x27Interviews\x27, value: interviewing, color: \x27#f59e0b\x27 },
      { name: \x27Offers\x27, value: offers, color: \x27#10b981\x27 }
    ];

    const iRate = applied > 0 ? ((interviewing / applied) * 100).toFixed(1) : "0.0";
    const oRate = interviewing > 0 ? ((offers / interviewing) * 100).toFixed(1) : "0.0";

    // Mock salary progression based on target
    const baseTarget = profile?.preferredSalary ? parseInt(profile.preferredSalary.replace(/\\D/g, "")) : 120;
    const val = isNaN(baseTarget) ? 120 : baseTarget / 1000;
    
    const sData = [
      { month: \x27Jan\x27, expected: val, market: val - 5 },
      { month: \x27Feb\x27, expected: val, market: val - 2 },
      { month: \x27Mar\x27, expected: val + 5, market: val + 2 },
      { month: \x27Apr\x27, expected: val + 10, market: val + 15 },
      { month: \x27May\x27, expected: val + 15, market: val + 22 },
      { month: \x27Jun\x27, expected: val + 20, market: val + 25 },
    ];

    return { funnelData: fData, totalApplied: applied, interviewRate: iRate, offerRate: oRate, salaryData: sData };
  }, [applications, profile]);

"""

# Replace static arrays and signature
content = re.sub(r"const funnelData = \[[\s\S]*?\];\n\nconst salaryData = \[[\s\S]*?\];\n\nexport default function PerformanceAnalytics\(\) \{", dynamic_code, content)

# Update the display values
content = content.replace("<p className=\"text-3xl font-black text-slate-900 dark:text-white\">150</p>", "<p className=\"text-3xl font-black text-slate-900 dark:text-white\">{totalApplied}</p>")
content = content.replace("<p className=\"text-3xl font-black text-slate-900 dark:text-white\">8.0%</p>", "<p className=\"text-3xl font-black text-slate-900 dark:text-white\">{interviewRate}%</p>")

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated PerformanceAnalytics.tsx")

