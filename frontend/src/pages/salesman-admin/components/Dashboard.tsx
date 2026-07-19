import React from 'react';
import { SalesSupervisorDashboard } from '../../../components/dashboards/SalesSupervisorDashboard';

export default function Dashboard({ onAction }: { onAction?: (action: string, payload?: any) => void }) {
  return <SalesSupervisorDashboard onAction={onAction} />;
}
