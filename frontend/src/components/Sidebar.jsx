import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  FileSpreadsheet,
  Settings,
  CreditCard,
  BadgeDollarSign,
  FileText,
  Banknote,
  Users2,
  BookOpenText,
  ListChecks,
  UserCog,
  KeyRound,
  ShieldCheck,
  X,
} from 'lucide-react';
import { usePermission } from './context/PermissionContext';

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Users & Roles', path: '/users', icon: Users2, permission: 'user.read' },
  { name: 'Roles', path: '/roles', icon: UserCog, permission: 'role.read' },
  { name: 'Permissions', path: '/permissions', icon: KeyRound, permission: 'permission.read' },
  { name: 'Role Permissions', path: '/role-permissions', icon: ShieldCheck, permission: 'rolepermission.read' },
  { name: 'Settings', path: '/settings', icon: Settings, permission: 'settings.read' },
];

export default function Sidebar({ isOpen, closeSidebar }) {
  const { hasPermission } = usePermission();
  const visibleMenuItems = menuItems.filter((item) => !item.permission || hasPermission(item.permission));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              S
            </div>
            <span className="font-bold text-white text-base tracking-wide">EduAccounts</span>
          </div>
          <button
            onClick={closeSidebar}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`
                }
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* System status footer */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>MySQL Connected</span>
          </div>
        </div>
      </aside>
    </>
  );
}