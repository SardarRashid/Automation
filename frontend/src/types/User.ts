export interface CustomUser {
  uid?: string;
  email?: string;
  name?: string;
  role?: string;
  disabled?: boolean;
  locked?: boolean;
  loginAttempts?: number;
  maxLoginAttempts?: number;
  maxDevices?: number;
  sessionTimeout?: number;
  forcePasswordChange?: boolean;
  accountExpiry?: string;
  isReadOnly?: boolean;
  department?: string;
  phoneNumber?: string;
  location?: string;
  joinedDate?: string;
  
  // Dynamic application mapping synced with ApplicationRegistry
  applicationAccess?: Record<string, boolean>;
  permissions?: Record<string, boolean>;

  // Inventory Specifics
  assignedStoreRooms?: string[];
  assignedSection?: string;
  assignedStoreNum?: string;
  assignedLocation?: string;

  // Additional settings
  twoFactorEnabled?: boolean;
  ipWhitelist?: string;
  requireMfa?: boolean;
}
