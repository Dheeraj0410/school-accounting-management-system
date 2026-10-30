import { Menu, Bell, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePermission } from './context/PermissionContext';

export default function Navbar({ toggleSidebar }) {
  const navigate = useNavigate();
  const { setUserPermissions } = usePermission();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUserPermissions([]);
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none md:hidden"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-base md:text-lg font-bold text-slate-800">School Account System</h1>
          <p className="text-xs text-slate-400 hidden sm:block">Session 2026–2027</p>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        <button
          type="button"
          className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

        <div className="relative group flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm cursor-pointer group-hover:bg-blue-200 transition">
            {user.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
          </div>
          <div className="hidden sm:block text-left cursor-pointer group-hover:opacity-80 transition">
            <p className="text-sm font-semibold text-slate-700 leading-tight">{user.name || 'Accountant'}</p>
            <p className="text-xs text-slate-400 leading-tight">{user.email || 'finance@school.edu'}</p>
          </div>
          {/* Profile dropdown on hover */}
          <div className="absolute right-0 top-12 min-w-[160px] bg-white border border-slate-200 rounded-lg shadow-lg z-40 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150">
            <ul className="py-1">
              <li>
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-4 py-2 text-slate-700 hover:bg-slate-100 text-sm"
                  // Add your settings click handler here if needed
                >
                  <User className="w-4 h-4 text-slate-500" />
                  Settings
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 text-sm"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}