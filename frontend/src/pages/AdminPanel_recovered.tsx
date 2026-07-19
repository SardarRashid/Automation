import React, { useState, useEffect } from 'react';
import { database } from '../lib/firebase';
import { ref, onValue, set, remove, update } from 'firebase/database';
import { firebaseConfig } from '../lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useToast } from '../components/ui/ToastNotification';
import UserManagement from './admin/UserManagement';
import SystemSettings from './admin/SystemSettings';
import AuditLog from './admin/AuditLog';
import { getDefaultApplicationAccess } from '../config/ApplicationRegistry';
import {
  LayoutDashboard, Users, ShieldAlert, Key, Clock, AppWindow,
  Puzzle, Activity, Settings, Bell, X, UserPlus,
  MoreVertical, CheckCircle2, Smartphone,
  Monitor, SearchCode, Search as SearchIcon, FileSpreadsheet, HardDrive, Package, Shield
} from 'lucide-react';

interface CustomUser {
  password?: string;
  role?: string; // Legacy
  email?: string;
  disabled?: boolean;
  locked?: boolean;
  allowedApps?: {
    desktop?: boolean;
    app?: boolean;
    scanner?: boolean;
    scanner_admin?: boolean;
    salesman?: boolean;
    extension?: boolean;
  };
  applicationAccess?: {
    salesAdmin?: boolean;
    inventoryAdmin?: boolean;
    scanner?: boolean;
    exportHub?: boolean;
    reports?: boolean;
    extensions?: boolean;
    pythonDesktop?: boolean;
  };
  applicationRoles?: {
    salesAdmin?: string;
    inventoryAdmin?: string;
    scanner?: string;
    exportHub?: string;
    reports?: string;
    pythonDesktop?: string;
  };
  permissions?: {
    reports?: boolean;
    invoices?: boolean;
    request_forms?: boolean;
    reminders?: boolean;
    notes?: boolean;
    profile?: boolean;
    inventory_admin?: boolean;
    inventory_mobile?: boolean;
    app_hub?: boolean;
    scanner_tracking?: boolean;
    salesman_admin?: boolean;
    [key: string]: boolean | undefined;
  };
}

type AdminView = 'dashboard' | 'users' | 'user-management' | 'system-settings' | 'audit-log' | 'roles' | 'permissions' | 'pending' | 'apps' | 'extensions' | 'logs' | 'settings';

export interface SystemApp {
  name: string;
  type: string;
  active: boolean;
}

export interface SystemExtension {
  name: string;
  active: boolean;
}

export interface SystemRole {
  name: string;
  description: string;
}

export interface SystemPermission {
  name: string;
  description: string;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<Record<string, CustomUser>>({});
  
  // System States
  const [systemApps, setSystemApps] = useState<Record<string, SystemApp>>({});
  const [systemExtensions, setSystemExtensions] = useState<Record<string, SystemExtension>>({});
  const [systemRoles, setSystemRoles] = useState<Record<string, SystemRole>>({});
  const [systemPermissions, setSystemPermissions] = useState<Record<string, SystemPermission>>({});

  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<AdminView>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserKey, setSelectedUserKey] = useState<string | null>(null);
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);
  const [slideoverTab, setSlideoverTab] = useState<'details' | 'apps' | 'roles' | 'permissions'>('details');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<{key: string, email: string, role: string, password?: string} | null>(null);
  const [stagedChanges, setStagedChanges] = useState<Record<string, CustomUser>>({});
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [isSystemAdmin, setIsSystemAdmin] = useState(false);
  const { addToast } = useToast();
  
  // Modals state for system config
  const [isAddSystemModalOpen, setIsAddSystemModalOpen] = useState<{type: 'app' | 'extension' | 'role' | 'permission', open: boolean}>({type: 'app', open: false});
  const [newSystemItem, setNewSystemItem] = useState({ key: '', name: '', type: 'Web', description: '' });

  // Filter State
  const [filterApp, setFilterApp] = useState('All');
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [viewMode, setViewMode] = useState<'table' | 'spreadsheet'>('table');

  // Add User State
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserRole, setNewUserRole] = useState('scanner');

  useEffect(() => {
    const usersRef = ref(database, 'users');
    const appsRef = ref(database, 'system/apps');
    const extRef = ref(database, 'system/extensions');
    const rolesRef = ref(database, 'system/roles');
    const permsRef = ref(database, 'system/permissions');

    const unsubUsers = onValue(usersRef, (snapshot) => {
      setUsers(snapshot.val() || {});
      setLoading(false);
    });

    const unsubApps = onValue(appsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const defaultApps: Record<string, any> = {
        'scanner': { name: 'Scanner App', type: 'Mobile', active: true },
        'scanner_admin': { name: 'Scanner Admin', type: 'Web', active: true },
        'salesman': { name: 'Salesman App', type: 'Mobile', active: true },
        'salesman_admin': { name: 'Sales Admin', type: 'Web', active: true },
        'inventory': { name: 'Inventory App', type: 'Web', active: true },
        'inventory_admin': { name: 'Inventory Admin', type: 'Web', active: true },
        'app': { name: 'Inventory App (Legacy)', type: 'Web', active: true },
        'desktop': { name: 'Desktop Python App', type: 'Web', active: true }
      };
      
      const mergedApps = { ...defaultApps };
      Object.keys(data).forEach(key => {
        mergedApps[key] = { ...(defaultApps[key] || {}), ...data[key] };
      });
      setSystemApps(mergedApps);
    });

    const unsubExt = onValue(extRef, (snapshot) => {
      const data = snapshot.val() || {};
      const defaultExt: Record<string, any> = {
        'sticker': { name: 'Sticker Printer', active: true },
        'scraper': { name: 'Loginext Scraper', active: false },
        'extension': { name: 'Generic Extension', active: true }
      };
      const mergedExt = { ...defaultExt };
      Object.keys(data).forEach(key => {
        mergedExt[key] = { ...(defaultExt[key] || {}), ...data[key] };
      });
      setSystemExtensions(mergedExt);
    });

    const unsubRoles = onValue(rolesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const defaultRoles: Record<string, any> = {
        'scanner': { name: 'Storekeeper / Scanner', description: 'Mobile app access for scanning barcodes.' },
        'salesman': { name: 'Salesman', description: 'Sales mobile app access.' },
        'manager': { name: 'App / Manager', description: 'Inventory desktop app access with advanced management.' },
        'admin': { name: 'IT Admin', description: 'Super admin access to all apps.' },
        'extension': { name: 'Sticker Printer Extension', description: 'Access for sticker printing extension' }
      };
      const mergedRoles = { ...defaultRoles };
      Object.keys(data).forEach(key => {
        mergedRoles[key] = { ...(defaultRoles[key] || {}), ...data[key] };
      });
      setSystemRoles(mergedRoles);
    });

    const unsubPerms = onValue(permsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const defaultPerms: Record<string, any> = {
        'reports': { name: 'reports', description: 'Can view sale reports.' },
        'invoices': { name: 'invoices', description: 'Can process POs and invoices.' },
        'request_forms': { name: 'request_forms', description: 'Can create and manage request forms.' },
        'reminders': { name: 'reminders', description: 'Can create system reminders.' },
        'inventory_admin': { name: 'inventory_admin', description: 'Can administrate the inventory app.' },
        'salesman_admin': { name: 'salesman_admin', description: 'Can manage salesmen.' }
      };
      const mergedPerms = { ...defaultPerms };
      Object.keys(data).forEach(key => {
        mergedPerms[key] = { ...(defaultPerms[key] || {}), ...data[key] };