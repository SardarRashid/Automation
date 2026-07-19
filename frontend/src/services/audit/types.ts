export interface AuditLog {
  id: string;
  userId: string;
  userEmail?: string;
  userRole?: string;
  module: string;
  action: string;
  previousValue?: any;
  newValue?: any;
  timestamp: string;
  device: string;
  status: 'success' | 'failure' | 'pending';
}
