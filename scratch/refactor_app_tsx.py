import re

filepath = "Job-Portal/src/App.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Imports
content = content.replace(
    "import { auth, provider } from \"./lib/firebase\";",
    "import { auth, provider, database } from \"./lib/firebase\";\nimport { ref, get, set } from \"firebase/database\";"
)

# 2. Add isDataLoaded state right after activeTab
content = content.replace(
    "const [activeTab, setActiveTab] = useState",
    "const [isDataLoaded, setIsDataLoaded] = useState(false);\n  const [activeTab, setActiveTab] = useState"
)

# 3. Replace all the localStorage initializers with just their default values
content = re.sub(
    r"const \[profile, setProfile\] = useState<UserProfile>\(\(\) => \{.*?return (\{.*?\});\n  \}\);",
    r"const [profile, setProfile] = useState<UserProfile>(\1);",
    content, flags=re.DOTALL
)

content = re.sub(
    r"const \[applications, setApplications\] = useState<JobApplication\[\]>\(\(\) => \{.*?return (\[.*?\]);\n  \}\);",
    r"const [applications, setApplications] = useState<JobApplication[]>(\1);",
    content, flags=re.DOTALL
)

content = re.sub(
    r"const \[rejections, setRejections\] = useState<RejectionLearning\[\]>\(\(\) => \{.*?return (\[.*?\]);\n  \}\);",
    r"const [rejections, setRejections] = useState<RejectionLearning[]>(\1);",
    content, flags=re.DOTALL
)

content = re.sub(
    r"const \[automationLogs, setAutomationLogs\] = useState<ContinuousLoopLog\[\]>\(\(\) => \{.*?return (\[.*?\]);\n  \}\);",
    r"const [automationLogs, setAutomationLogs] = useState<ContinuousLoopLog[]>(\1);",
    content, flags=re.DOTALL
)

content = re.sub(
    r"const \[portfolio, setPortfolio\] = useState<PortfolioEntry\[\]>\(\(\) => \{.*?return (\[.*?\]);\n  \}\);",
    r"const [portfolio, setPortfolio] = useState<PortfolioEntry[]>(\1);",
    content, flags=re.DOTALL
)

content = re.sub(
    r"const \[emailResponses, setEmailResponses\] = useState<EmailResponse\[\]>\(\(\) => \{.*?return saved \? JSON.parse\(saved\) : (\[\]);\n  \}\);",
    r"const [emailResponses, setEmailResponses] = useState<EmailResponse[]>(\1);",
    content, flags=re.DOTALL
)

content = re.sub(
    r"const \[companies, setCompanies\] = useState<CompanyInfo\[\]>\(\(\) => \{.*?return (\[.*?\]);\n  \}\);",
    r"const [companies, setCompanies] = useState<CompanyInfo[]>(\1);",
    content, flags=re.DOTALL
)

# 4. Remove localStorage setItems
content = re.sub(r"// --- PERSISTENCE ---[\s\S]*?// Auth state observer", r"// Auth state observer", content)

# 5. Add DB Sync Logic in onAuthStateChanged
db_sync = """// --- PERSISTENCE ---
  useEffect(() => {
    if (!isDataLoaded || !googleUser) return;
    const userKey = googleUser.email!.toLowerCase().replace(/[.#$\\[\\]]/g, "_");
    const syncData = setTimeout(() => {
      set(ref(database, `users/${userKey}/jobPortalData`), {
        profile,
        applications,
        rejections,
        automationLogs,
        portfolio,
        companies,
        emailResponses
      });
    }, 1000);
    return () => clearTimeout(syncData);
  }, [profile, applications, rejections, automationLogs, portfolio, companies, emailResponses, isDataLoaded, googleUser]);

  // Auth state observer"""

content = content.replace("// Auth state observer", db_sync)

load_data = """if (user) {
        setGoogleUser(user);
        const userKey = user.email!.toLowerCase().replace(/[.#$\\[\\]]/g, "_");
        get(ref(database, `users/${userKey}/jobPortalData`)).then((snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            if (data.profile) setProfile(data.profile);
            if (data.applications) setApplications(data.applications);
            if (data.rejections) setRejections(data.rejections);
            if (data.automationLogs) setAutomationLogs(data.automationLogs);
            if (data.portfolio) setPortfolio(data.portfolio);
            if (data.companies) setCompanies(data.companies);
            if (data.emailResponses) setEmailResponses(data.emailResponses);
          }
          setIsDataLoaded(true);
        }).catch(e => {
          console.error("Failed to load DB data", e);
          setIsDataLoaded(true);
        });
      } else {
        setIsDataLoaded(true);
        setGoogleUser(null);"""

content = content.replace("if (user) {\n        setGoogleUser(user);\n      } else {\n        setGoogleUser(null);", load_data)

# 6. Reconnect Gmail prompt logic
header_pattern = """<div className="p-4 border-b border-slate-200/60 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveTab('dashboard')}"""

reconnect_ui = """<div className="p-4 border-b border-slate-200/60 flex flex-wrap items-center justify-between gap-4">
              {googleUser && !googleToken && (
                <div className="w-full bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg flex justify-between items-center mb-2">
                  <span className="text-sm">Gmail API is disconnected. Connect to scan recruiter emails.</span>
                  <button onClick={handleGoogleSignIn} disabled={isLoggingIn} className="text-sm font-semibold hover:underline">Reconnect Gmail</button>
                </div>
              )}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveTab('dashboard')}"""

content = content.replace(header_pattern, reconnect_ui)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("App.tsx refactored successfully.")
