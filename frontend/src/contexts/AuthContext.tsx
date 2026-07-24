import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, database, signInUser, registerUser as fbRegisterUser, logoutUser as fbLogoutUser } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { ref, onValue, off, set } from 'firebase/database';

export interface UserProfile {
  name?: string;
  email?: string;
  role?: string;
  disabled?: boolean;
  locked?: boolean;
  forcePasswordChange?: boolean;
  sessionTimeout?: number;
  permissions?: Record<string, boolean>;
  applicationAccess?: Record<string, boolean>;
  [key: string]: any;
}

export interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  userRole: string;
  permissions: Record<string, boolean>;
  applicationAccess: Record<string, boolean>;
  isSystemAdmin: boolean;
  isRecoveryMode: boolean;
  loading: boolean;
  loginError: string;
  showForcePasswordChange: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  setLoginError: (error: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const OWNER_EMAIL = 'sardarrashid121@gmail.com';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [applicationAccess, setApplicationAccess] = useState<Record<string, boolean>>({});
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [showForcePasswordChange, setShowForcePasswordChange] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState<number | null>(null);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let validationInterval: NodeJS.Timeout;
    
    const resetTimer = () => {
      clearTimeout(timeoutId);
      if (sessionTimeout && user) {
        timeoutId = setTimeout(() => {
          logout();
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

    // Periodic session validation - check if user was disabled/locked while logged in
    if (user && userProfile && !isRecoveryMode) {
      validationInterval = setInterval(async () => {
        if (userProfile?.disabled || userProfile?.locked) {
          await logout();
          setLoginError(userProfile.disabled ? "Your account has been disabled by an administrator." : "Your account has been locked. Please contact support.");
        }
      }, 60000); // Check every minute
    }

    return () => {
      clearTimeout(timeoutId);
      clearInterval(validationInterval);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("scroll", resetTimer);
    };
  }, [sessionTimeout, user, userProfile, isRecoveryMode]);

  useEffect(() => {
    let dbRef: any = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser && currentUser.email) {
        const isOwner = currentUser.email.toLowerCase() === OWNER_EMAIL;
        
        // Setup database listener
        // IMPORTANT: Must match the same key format used when creating users in AdminPanel
        const userKey = currentUser.email.toLowerCase().replace(/[.#$\[\]]/g, '_');
        
        // Ensure uid mapping is stored
        set(ref(database, `uid_mappings/${currentUser.uid}`), userKey).catch(console.error);

        dbRef = ref(database, `users/${userKey}`);
        
        onValue(dbRef, (snapshot) => {
          const data = snapshot.val();
          
          if (data) {
            // Check for disabled/locked (but Owner bypasses this)
            if (!isOwner && (data.disabled || data.locked)) {
              fbLogoutUser();
              setLoginError("Your account has been disabled or locked.");
              setLoading(false);
              return;
            }

            setUserProfile(data);
            setUserRole(data.role || 'user');
            setShowForcePasswordChange(!!data.forcePasswordChange);
            
            if (data.sessionTimeout && typeof data.sessionTimeout === "number") {
                setSessionTimeout(data.sessionTimeout);
            }

            const isSysAdmin = data.role === 'system_admin' || 
                               data.role === 'admin';
            setIsSystemAdmin(isSysAdmin || isOwner);
            setIsRecoveryMode(isOwner);

            if (isSysAdmin || isOwner) {
              // Full permissions and apps for system admin or owner
              setPermissions(new Proxy({}, { get: () => true }));
              setApplicationAccess(new Proxy({}, { get: () => true }));
            } else {
              setPermissions(data.permissions || {});
              setApplicationAccess(data.applicationAccess || {});
            }
          } else {
            // No profile found
            if (isOwner) {
              console.warn("Owner profile missing. Engaging Recovery Mode.");
              setIsRecoveryMode(true);
              setIsSystemAdmin(true);
              setPermissions(new Proxy({}, { get: () => true }));
              setApplicationAccess(new Proxy({}, { get: () => true }));
            } else {
              // Normal user missing profile? 
              setUserProfile({});
            }
          }
          setLoading(false);
        }, (error) => {
          // Database read error
          console.error("Database read error in AuthContext", error);
          if (isOwner) {
            console.warn("Owner database access failed. Engaging Recovery Mode.");
            setIsRecoveryMode(true);
            setIsSystemAdmin(true);
            setPermissions(new Proxy({}, { get: () => true }));
            setApplicationAccess(new Proxy({}, { get: () => true }));
          } else {
            fbLogoutUser();
            setLoginError("Unable to retrieve profile data. Please contact support.");
          }
          setLoading(false);
        });

      } else {
        // Logged out
        if (dbRef) off(dbRef);
        setUserProfile(null);
        setUserRole('');
        setPermissions({});
        setApplicationAccess({});
        setIsSystemAdmin(false);
        setIsRecoveryMode(false);
        setShowForcePasswordChange(false);
        setSessionTimeout(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (dbRef) off(dbRef);
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setLoginError('');
    try {
      await signInUser(email, pass);
    } catch (err: any) {
      setLoginError(err.message || 'Authentication failed');
      throw err;
    }
  };

  const register = async (email: string, pass: string) => {
    setLoginError('');
    try {
      await fbRegisterUser(email, pass);
    } catch (err: any) {
      setLoginError(err.message || 'Registration failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await fbLogoutUser();
      setLoginError('');
      
      // Clear localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('user_') || key.startsWith('auth_') || key.startsWith('session_') || key.startsWith('inventory')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, userProfile, userRole, permissions, applicationAccess,
      isSystemAdmin, isRecoveryMode, loading, loginError, showForcePasswordChange,
      login, register, logout, setLoginError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
