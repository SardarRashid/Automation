
import re

filepath = "frontend/src/App.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Add states
states_block = "  const [isSystemAdmin, setIsSystemAdmin] = useState(false);"
new_states = """  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  const [showForcePasswordChange, setShowForcePasswordChange] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState<number | null>(null);"""
content = content.replace(states_block, new_states)

# Auth state changes
auth_block = """          const data = snapshot.val();
          if (data) {
            setUserProfile(data);"""
new_auth_block = """          const data = snapshot.val();
          if (data) {
            if (data.disabled || data.locked) {
              logoutUser();
              setLoginError("Your account has been disabled or locked. Please contact your administrator.");
              return;
            }
            if (data.accountExpiry && new Date(data.accountExpiry).getTime() < Date.now()) {
              logoutUser();
              setLoginError("Your account has expired. Please contact your administrator.");
              return;
            }
            if (data.forcePasswordChange) {
              setShowForcePasswordChange(true);
            } else {
              setShowForcePasswordChange(false);
            }
            
            if (data.sessionTimeout && typeof data.sessionTimeout === "number") {
                setSessionTimeout(data.sessionTimeout);
            }

            setUserProfile(data);"""
content = content.replace(auth_block, new_auth_block)

# Add session timeout effect
use_effect_block = """  useEffect(() => {
    if (isDarkMode) {"""
new_use_effect = """  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const resetTimer = () => {
      clearTimeout(timeoutId);
      if (sessionTimeout && user) {
        // sessionTimeout is stored in minutes, convert to ms
        timeoutId = setTimeout(() => {
          logoutUser();
          setLoginError("Your session has expired due to inactivity.");
        }, sessionTimeout * 60 * 1000);
      }
    };

    if (sessionTimeout && user) {
      window.addEventListener("mousemove", resetTimer);
      window.addEventListener("keydown", resetTimer);
      window.addEventListener("scroll", resetTimer);
      resetTimer();
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("scroll", resetTimer);
    };
  }, [sessionTimeout, user]);

  useEffect(() => {
    if (isDarkMode) {"""
content = content.replace(use_effect_block, new_use_effect)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("App.tsx refactored.")

