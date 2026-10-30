import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PermissionRoute from './components/PermissionRoute';
import { PermissionProvider } from './components/context/PermissionContext';
import Permissions from './pages/Permissions';
import Role from './pages/Role';
import RolePermission from './pages/RolePermission';
import Users from './pages/Users';

export default function App() {
  return (
    <PermissionProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route path="/permissions" element={
          <ProtectedRoute><PermissionRoute permission="permission.read"><MainLayout><Permissions /></MainLayout></PermissionRoute></ProtectedRoute>
        } />
        <Route path="/roles" element={
          <ProtectedRoute><PermissionRoute permission="role.read"><MainLayout><Role /></MainLayout></PermissionRoute></ProtectedRoute>
        } />
        <Route path="/role-permissions" element={
          <ProtectedRoute><PermissionRoute permission="rolepermission.read"><MainLayout><RolePermission /></MainLayout></PermissionRoute></ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute><PermissionRoute permission="user.read"><MainLayout><Users /></MainLayout></PermissionRoute></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
    </PermissionProvider>
  );
}