import { Navigate } from 'react-router-dom';
import { usePermission } from './context/PermissionContext';

export default function PermissionRoute({ permission, children }) {
  const { hasPermission, permissionsLoading, permissionsError } = usePermission();
  if (permissionsLoading) {
    return <p role="status" className="p-6 text-slate-600">Loading permissions…</p>;
  }
  if (permissionsError) {
    return <p role="alert" className="m-6 rounded bg-red-50 p-3 text-red-700">{permissionsError}</p>;
  }
  return hasPermission(permission) ? children : <Navigate to="/dashboard" replace />;
}
